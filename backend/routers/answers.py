"""
================================================================================
访谈回答 API 路由
================================================================================
功能：
    管理评估过程中对每道题目的回答数据。
    支持单题更新和批量更新两种模式。

行业筛选：
    根据项目的 company_type 自动过滤 离散/流程 行业专属题目。
    GET /projects/{pid}/answers 只返回适用于当前企业类型的题目回答。

API 端点：
    GET    /api/projects/{pid}/answers              - 获取项目回答（按企业类型筛选）
    PUT    /api/projects/{pid}/answers/{qid}        - 更新单题回答
    PATCH  /api/projects/{pid}/answers/bulk         - 批量更新回答

评分逻辑：
    - 每次选择或修改沟通等级时，自动从题目的 options_json 中查找对应分值
    - 得分 = 所选等级对应的 score 值
    - 批量保存时，逐题重新计算得分

================================================================================
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.answer import AssessmentAnswer
from models.question import Question
from models.project import AssessmentProject
from schemas.answer import AnswerUpdate, AnswerBulkUpdate
from services.scoring import calculate_score
from typing import List

router = APIRouter()


import json
import re


def _should_show_question(question, company_type: str) -> bool:
    """判断题目是否应该显示（与 categories API 保持一致）"""
    if company_type == "通用":
        return True

    title = question.title

    if company_type == "离散":
        return "流程行业：" not in title

    if company_type == "流程":
        # 排除离散-流程成对题目中的离散版本（x.1/x.2 格式），
        # 保留离散独享题（如27/28/29/72/73/79/80/95）
        if "离散行业" in title:
            if re.search(r'(\d+)[.](1|2)[.]', title):
                return False
        return True

    return True


def _format_answer(answer, question):
    """格式化单个回答数据"""
    return {
        "id": answer.id,
        "question_id": answer.question_id,
        "question": {
            "id": question.id,
            "title": question.title,
            "sort_order": question.sort_order,
            "max_score": question.max_score,
            "industry_type": question.industry_type,
            "is_multi_select": question.is_multi_select,
            "sub_sub_category_id": question.sub_sub_category_id,
            "options": eval(question.options_json) if question.options_json else [],
        },
        "selected_level": answer.selected_level,
        "target_level": answer.target_level,
        "communication_content": answer.communication_content,
        "company_status": answer.company_status,
        "score": answer.score,
        "is_applicable": answer.is_applicable,
    }


@router.get("/projects/{project_id}/answers")
def list_answers(project_id: int, db: Session = Depends(get_db)):
    """
    获取项目的所有回答记录。

    根据项目的 company_type 自动过滤行业专属题目。
    如果某个适用的题目还没有回答记录，会自动创建一条空记录。
    """
    # 验证项目是否存在
    project = db.query(AssessmentProject).filter(AssessmentProject.id == project_id).first()
    if not project:
        raise HTTPException(404, "项目不存在")

    company_type = project.company_type or "通用"

    # 获取所有已有回答
    existing = db.query(AssessmentAnswer).filter(
        AssessmentAnswer.project_id == project_id
    ).all()
    existing_qids = {a.question_id for a in existing}

    # 查询所有题目，为适用的题目补建回答记录
    questions = db.query(Question).all()
    for q in questions:
        if q.id not in existing_qids and _should_show_question(q, company_type):
            db.add(AssessmentAnswer(project_id=project_id, question_id=q.id))
    db.commit()

    # 查询所有回答
    answers = db.query(AssessmentAnswer).filter(
        AssessmentAnswer.project_id == project_id
    ).all()

    # 只返回适用于当前企业类型的题目回答
    result = []
    for a in answers:
        question = db.query(Question).filter(Question.id == a.question_id).first()
        if question and _should_show_question(question, company_type):
            result.append(_format_answer(a, question))

    return result


@router.put("/projects/{project_id}/answers/{question_id}")
def update_answer(project_id: int, question_id: int, data: AnswerUpdate, db: Session = Depends(get_db)):
    """
    更新单题回答。

    支持更新：沟通等级、目标等级、沟通内容、企业现状、是否适用。
    修改沟通等级后，自动重新计算得分。
    如果回答不存在，会自动创建新记录。
    """
    # 验证项目是否存在
    project = db.query(AssessmentProject).filter(AssessmentProject.id == project_id).first()
    if not project:
        raise HTTPException(404, "项目不存在")

    answer = db.query(AssessmentAnswer).filter(
        AssessmentAnswer.project_id == project_id,
        AssessmentAnswer.question_id == question_id
    ).first()

    # 回答不存在时自动创建
    if not answer:
        answer = AssessmentAnswer(project_id=project_id, question_id=question_id)
        db.add(answer)

    # 更新各字段
    for key, value in data.model_dump(exclude_unset=True).items():
        if key == "is_applicable" and value is not None:
            setattr(answer, "is_applicable", 1 if value else 0)
        elif value is not None:
            setattr(answer, key, value)

    # 重新计算得分
    if data.selected_level is not None:
        answer.score = calculate_score(answer.selected_level, question_id, db)
    elif answer.selected_level:
        answer.score = calculate_score(answer.selected_level, question_id, db)

    db.commit()
    db.refresh(answer)

    question = db.query(Question).filter(Question.id == question_id).first()
    return {
        "id": answer.id,
        "question_id": question_id,
        "question": {
            "id": question.id,
            "title": question.title,
            "options": eval(question.options_json) if question.options_json else [],
        },
        "selected_level": answer.selected_level,
        "target_level": answer.target_level,
        "communication_content": answer.communication_content,
        "company_status": answer.company_status,
        "score": answer.score,
    }


@router.patch("/projects/{project_id}/answers/bulk")
def bulk_update_answers(project_id: int, data: AnswerBulkUpdate, db: Session = Depends(get_db)):
    """
    批量更新回答（一次性保存多道题目的回答数据）。

    适用于前端"全部保存"场景，减少 API 调用次数。
    每道题的沟通等级修改后都会自动重新计算得分。
    """
    results = []
    for item in data.answers:
        answer = db.query(AssessmentAnswer).filter(
            AssessmentAnswer.project_id == project_id,
            AssessmentAnswer.question_id == item.question_id
        ).first()

        if not answer:
            answer = AssessmentAnswer(project_id=project_id, question_id=item.question_id)
            db.add(answer)

        # 逐项更新字段
        if item.selected_level is not None:
            answer.selected_level = item.selected_level
            answer.score = calculate_score(answer.selected_level, item.question_id, db)
        if item.target_level is not None:
            answer.target_level = item.target_level
        if item.communication_content is not None:
            answer.communication_content = item.communication_content
        if item.company_status is not None:
            answer.company_status = item.company_status
        if item.is_applicable is not None:
            answer.is_applicable = 1 if item.is_applicable else 0

        results.append(answer.id)

    db.commit()
    return {"updated": results}
