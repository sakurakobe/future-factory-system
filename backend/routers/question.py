"""
================================================================================
题目管理 API 路由
================================================================================
功能：
    提供题目的增删改查（CRUD）接口，支持在线管理题目数据。

    题目属于某个细项（sub_sub_category），管理端可以对题目进行：
    - 查询：获取指定细项下的所有题目
    - 新增：在指定细项下添加新题目
    - 修改：修改题目信息（标题、等级选项等）
    - 删除：删除题目（同时删除关联的回答数据）

API 端点：
    GET    /api/questions?sub_sub_category_id=N  - 查询细项下的所有题目
    GET    /api/questions/{question_id}           - 查询单个题目详情
    POST   /api/questions                         - 新增题目
    PUT    /api/questions/{question_id}           - 修改题目
    DELETE /api/questions/{question_id}           - 删除题目

================================================================================
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.question import Question
from models.answer import AssessmentAnswer
import json
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter()


@router.get("/departments")
def list_departments(db: Session = Depends(get_db)):
    """获取所有已填写的责任部门列表（去重）"""
    questions = db.query(Question).filter(
        Question.responsible_dept != "",
        Question.responsible_dept.isnot(None),
    ).all()
    depts = sorted(set(q.responsible_dept for q in questions if q.responsible_dept))
    return {"departments": depts}


# ---- 请求/响应模型 ----

class LevelOptionSchema(BaseModel):
    """单个等级选项"""
    level: str
    score: float
    description: str
    target_level: str


class QuestionCreate(BaseModel):
    """新增题目请求体"""
    sub_sub_category_id: int
    sort_order: int = 0
    title: str
    max_score: float = 0.0
    industry_type: str = "通用"
    responsible_dept: str = ""
    options: List[LevelOptionSchema] = []


class QuestionUpdate(BaseModel):
    """修改题目请求体"""
    sort_order: Optional[int] = None
    title: Optional[str] = None
    max_score: Optional[float] = None
    industry_type: Optional[str] = None
    responsible_dept: Optional[str] = None
    options: Optional[List[LevelOptionSchema]] = None


# ---- API 端点 ----

@router.get("/questions")
def list_questions(sub_sub_category_id: int, db: Session = Depends(get_db)):
    """
    查询指定细项下的所有题目。

    参数：
        sub_sub_category_id: 细项ID
    """
    questions = db.query(Question).filter(
        Question.sub_sub_category_id == sub_sub_category_id
    ).order_by(Question.sort_order).all()

    return [{
        "id": q.id,
        "sub_sub_category_id": q.sub_sub_category_id,
        "sort_order": q.sort_order,
        "title": q.title,
        "max_score": q.max_score,
        "industry_type": q.industry_type,
        "responsible_dept": q.responsible_dept,
        "is_multi_select": q.is_multi_select,
        "options": json.loads(q.options_json) if q.options_json else [],
    } for q in questions]


@router.get("/questions/{question_id}")
def get_question(question_id: int, db: Session = Depends(get_db)):
    """
    查询单个题目详情。
    """
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(404, "题目不存在")

    return {
        "id": question.id,
        "sub_sub_category_id": question.sub_sub_category_id,
        "sort_order": question.sort_order,
        "title": question.title,
        "max_score": question.max_score,
        "industry_type": question.industry_type,
        "responsible_dept": question.responsible_dept,
        "is_multi_select": question.is_multi_select,
        "options": json.loads(question.options_json) if question.options_json else [],
    }


@router.post("/questions")
def create_question(data: QuestionCreate, db: Session = Depends(get_db)):
    """
    新增题目。

    在指定细项下添加新题目，等级选项以 options 数组形式传入。
    """
    # 验证细项存在
    from models.category import SubSubCategory
    subsub = db.query(SubSubCategory).filter(
        SubSubCategory.id == data.sub_sub_category_id
    ).first()
    if not subsub:
        raise HTTPException(404, "细项不存在")

    # 构建 options_json
    options_json = json.dumps([
        {"level": opt.level, "score": opt.score, "description": opt.description, "target_level": opt.target_level}
        for opt in data.options
    ], ensure_ascii=False)

    question = Question(
        sub_sub_category_id=data.sub_sub_category_id,
        sort_order=data.sort_order,
        title=data.title,
        max_score=data.max_score,
        industry_type=data.industry_type,
        responsible_dept=data.responsible_dept,
        options_json=options_json,
    )
    db.add(question)
    db.commit()
    db.refresh(question)

    return {
        "id": question.id,
        "message": "题目创建成功",
    }


@router.put("/questions/{question_id}")
def update_question(question_id: int, data: QuestionUpdate, db: Session = Depends(get_db)):
    """
    修改题目信息。

    支持部分更新，只传需要修改的字段。
    """
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(404, "题目不存在")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "options":
            # 将 options 转为 JSON 存储
            question.options_json = json.dumps([
                {"level": opt.level, "score": opt.score, "description": opt.description, "target_level": opt.target_level}
                for opt in value
            ], ensure_ascii=False)
        else:
            setattr(question, field, value)

    db.commit()
    db.refresh(question)

    return {
        "id": question.id,
        "message": "题目修改成功",
    }


@router.delete("/questions/{question_id}")
def delete_question(question_id: int, db: Session = Depends(get_db)):
    """
    删除题目。

    删除题目的同时，级联删除所有关联的回答数据。
    """
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(404, "题目不存在")

    # 级联删除关联回答
    db.query(AssessmentAnswer).filter(
        AssessmentAnswer.question_id == question_id
    ).delete()

    db.delete(question)
    db.commit()

    return {"message": "题目删除成功"}
