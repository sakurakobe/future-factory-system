"""
================================================================================
分类管理 API 路由
================================================================================
功能：
    提供分类树查询接口，返回完整的"方面 → 子类 → 细项 → 题目"四级结构。
    支持根据企业类型（通用/离散/流程）过滤题目。

API 端点：
    GET /api/categories/tree?company_type=通用 - 获取分类树（默认显示全部）
    GET /api/categories/tree?company_type=离散 - 仅显示离散行业题目
    GET /api/categories/tree?company_type=流程 - 仅显示流程行业题目

筛选规则：
    - 通用：显示全部 105 道题
    - 离散：排除 5 道"流程行业："配对题，保留全部 100 题
    - 流程：排除 5 道"离散行业："配对题（4.2/5.2/30.2/38.2/39.2），
             保留 8 道"离散独享"题（因作为通用题使用）
    - 两个模式筛选后均为 100 题
    - 成对题识别：编号匹配（如 4.1↔4.2、5.1↔5.2、30.1↔30.2、38.1↔38.2、39.1↔39.2）
================================================================================
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from sqlalchemy.orm import joinedload
from models.category import MajorCategory, SubCategory, SubSubCategory
from models.question import Question
import json

router = APIRouter()


def _should_show_question(question, company_type: str) -> bool:
    """
    判断题目是否应该显示。

    判断逻辑：
    - 通用：所有题目都显示
    - 离散：排除含"流程行业："的流程行业配对题（5道）
    - 流程：排除离散-流程成对题目中的离散版本（5道），
            保留"离散独享"题（8道，作为通用题在两模式中均显示）

    成对题识别：标题中含"离散行业"且编号格式为 x.1 或 x.2（如4.1↔4.2、5.1↔5.2等）
    独享题识别：标题中含"离散行业"但无 x.1/x.2 编号格式（如27.、28.、29.等）
    """
    if company_type == "通用":
        return True

    title = question.title

    if company_type == "离散":
        # 排除流程行业专属题目（标题中含"流程行业："）
        return "流程行业：" not in title

    if company_type == "流程":
        # 排除离散-流程成对题目中的离散版本
        # 识别方式：标题中含"离散行业"且编号格式为 x.1 或 x.2
        if "离散行业" in title:
            import re
            if re.search(r'(\d+)[.](1|2)[.]', title):
                return False
        return True

    return True


def _calc_sub_sub_max(sub_sub_id: int, company_type: str, db: Session) -> float:
    """计算细项的实际 max_score（根据筛选后的题目计算）"""
    questions = db.query(Question).filter(
        Question.sub_sub_category_id == sub_sub_id
    ).all()
    return sum(q.max_score for q in questions if _should_show_question(q, company_type))


def _calc_sub_max(sub_id: int, company_type: str, db: Session) -> float:
    """计算子类的实际 max_score"""
    subsubs = db.query(SubSubCategory).filter(
        SubSubCategory.sub_category_id == sub_id
    ).all()
    return sum(_calc_sub_sub_max(ss.id, company_type, db) for ss in subsubs)


def _calc_major_max(major_id: int, company_type: str, db: Session) -> float:
    """计算主要方面的实际 max_score"""
    subs = db.query(SubCategory).filter(
        SubCategory.major_category_id == major_id
    ).all()
    return sum(_calc_sub_max(s.id, company_type, db) for s in subs)


@router.get("/tree")
def get_category_tree(
    db: Session = Depends(get_db),
    company_type: str = Query(default="通用", description="企业类型（通用/离散/流程）")
):
    """
    获取分类树（含题目和等级选项），支持按企业类型筛选。

    参数：
        company_type: 企业类型，默认"通用"
            - "通用"：显示全部 105 道题
            - "离散"：显示 100 道题（排除 5 道流程行业配对题）
            - "流程"：显示 100 道题（排除 5 道离散行业配对题，
                     保留 8 道离散独享题作为通用题）

    返回动态 max_score（根据筛选后的题目重新计算）
    """
    majors = db.query(MajorCategory).order_by(MajorCategory.sort_order).all()

    result = []
    for major in majors:
        subs = db.query(SubCategory).filter(
            SubCategory.major_category_id == major.id
        ).order_by(SubCategory.sort_order).all()

        sub_list = []
        for sub in subs:
            subsubs = db.query(SubSubCategory).filter(
                SubSubCategory.sub_category_id == sub.id
            ).order_by(SubSubCategory.sort_order).all()

            subsub_list = []
            for ss in subsubs:
                questions = db.query(Question).filter(
                    Question.sub_sub_category_id == ss.id
                ).order_by(Question.sort_order).all()

                q_list = []
                for q in questions:
                    # 根据企业类型筛选题目
                    if not _should_show_question(q, company_type):
                        continue
                    q_list.append({
                        "id": q.id,
                        "sort_order": q.sort_order,
                        "title": q.title,
                        "max_score": q.max_score,
                        "industry_type": q.industry_type,
                        "responsible_dept": q.responsible_dept,
                        "is_multi_select": q.is_multi_select,
                        "options": json.loads(q.options_json) if q.options_json else [],
                    })

                # 细项 max_score 使用筛选后题目的实际总分
                subsub_max = sum(q["max_score"] for q in q_list)

                subsub_list.append({
                    "id": ss.id,
                    "sort_order": ss.sort_order,
                    "name": ss.name,
                    "max_score": subsub_max,
                    "questions": q_list,
                })

            # 子类 max_score 使用筛选后细项的实际总分
            sub_max = sum(s["max_score"] for s in subsub_list)

            sub_list.append({
                "id": sub.id,
                "sort_order": sub.sort_order,
                "name": sub.name,
                "max_score": sub_max,
                "description": sub.description,
                "sub_sub_categories": subsub_list,
            })

        # 主要方面 max_score 使用筛选后子类的实际总分
        major_max = sum(s["max_score"] for s in sub_list)

        result.append({
            "id": major.id,
            "sort_order": major.sort_order,
            "name": major.name,
            "max_score": major_max,
            "description": major.description,
            "sub_categories": sub_list,
        })

    return {"categories": result, "company_type": company_type}
