"""
================================================================================
得分汇总服务
================================================================================
功能：
    计算项目的得分汇总数据，包括：
    - 总分、满分、得分率
    - 各大类（方面）的得分和得分率
    - 各子类（用于雷达图展示，含当前得分、满分、目标得分）

使用场景：
    1. 前端 ScoreSummary 组件实时显示总分
    2. 报告页面雷达图渲染
    3. 得分对比分析（当前得分 vs 目标得分）

行业筛选：
    根据项目的 company_type 自动过滤 离散/流程 行业专属题目，
    确保总分等于筛选后题目的 max_score 之和。

================================================================================
"""
import json
from sqlalchemy.orm import Session
from models.category import MajorCategory, SubCategory, SubSubCategory
from models.question import Question
from models.answer import AssessmentAnswer
from models.project import AssessmentProject
from schemas.report import ScoreSummary, MajorScore, RadarDataPoint


def _should_count_question(question, company_type: str) -> bool:
    """
    判断题目是否应计入得分（与 categories API 的筛选逻辑一致）。
    """
    if company_type == "通用":
        return True
    title = question.title
    if company_type == "离散":
        return "流程行业：" not in title
    if company_type == "流程":
        return "离散行业：" not in title
    return True


def get_score_summary(project_id: int, db: Session) -> ScoreSummary:
    """
    获取项目的完整得分汇总和雷达图数据。

    根据项目的 company_type 自动过滤行业专属题目，
    确保满分等于筛选后题目的分值之和。
    """
    # 获取项目信息（含 company_type）
    project = db.query(AssessmentProject).filter(
        AssessmentProject.id == project_id
    ).first()
    company_type = project.company_type if project else "通用"

    # 查询项目所有适用的回答
    answers = db.query(AssessmentAnswer).filter(
        AssessmentAnswer.project_id == project_id,
        AssessmentAnswer.is_applicable == 1
    ).all()

    # 构建 question_id → answer 的映射
    answer_map = {}
    for a in answers:
        answer_map[a.question_id] = a

    major_scores = []
    radar_data = []
    total_score = 0
    total_max = 0

    majors = db.query(MajorCategory).order_by(MajorCategory.sort_order).all()

    for major in majors:
        major_score = 0
        major_max = 0
        sub_categories = db.query(SubCategory).filter(
            SubCategory.major_category_id == major.id
        ).order_by(SubCategory.sort_order).all()

        for sub in sub_categories:
            sub_score = 0
            sub_target_score = 0
            sub_max = 0

            subsubs = db.query(SubSubCategory).filter(
                SubSubCategory.sub_category_id == sub.id
            ).all()

            for ss in subsubs:
                questions = db.query(Question).filter(
                    Question.sub_sub_category_id == ss.id
                ).all()

                for q in questions:
                    # 根据 company_type 过滤题目
                    if not _should_count_question(q, company_type):
                        continue
                    sub_max += q.max_score
                    if q.id in answer_map:
                        a = answer_map[q.id]
                        if a.score:
                            sub_score += a.score
                        if a.target_level:
                            options = json.loads(q.options_json)
                            for opt in options:
                                if opt["level"] == a.target_level:
                                    sub_target_score += opt["score"]
                                    break

            percentage = (sub_score / sub_max * 100) if sub_max > 0 else 0
            radar_data.append(RadarDataPoint(
                name=sub.name,
                score=sub_score,
                max_score=sub_max,
                percentage=percentage,
                target_score=sub_target_score
            ))
            major_score += sub_score
            major_max += sub_max

        total_score += major_score
        total_max += major_max
        major_percentage = (major_score / major_max * 100) if major_max > 0 else 0
        major_scores.append(MajorScore(
            name=major.name,
            score=major_score,
            max_score=major_max,
            percentage=major_percentage
        ))

    total_pct = (total_score / total_max * 100) if total_max > 0 else 0

    return ScoreSummary(
        total_score=round(total_score, 2),
        total_max=total_max,
        percentage=round(total_pct, 2),
        major_scores=major_scores,
        radar_data=radar_data
    )


def get_answer_with_question(answer_id: int, project_id: int, db: Session):
    """获取单个回答的详细信息（含关联题目数据）"""
    answer = db.query(AssessmentAnswer).filter(
        AssessmentAnswer.id == answer_id,
        AssessmentAnswer.project_id == project_id
    ).first()
    if not answer:
        return None
    question = db.query(Question).filter(Question.id == answer.question_id).first()
    return answer, question
