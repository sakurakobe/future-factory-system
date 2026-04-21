"""
================================================================================
数据库模型 - 访谈回答
================================================================================
说明：
    定义评估过程中对每道题目的回答数据。
    每个项目 × 每道题 = 一条回答记录。

核心字段：
    selected_level: 沟通等级（企业当前达到的等级 A-F）
    target_level: 目标等级（企业希望达到的等级 A-F）
    communication_content: 与企业沟通的要点记录
    company_status: 企业当前实际情况描述
    score: 自动计算得分（从题目 options_json 中查找）
    is_applicable: 是否适用（1=适用，0=不适用，不参与评分）

唯一约束：
    (project_id, question_id) 必须唯一，确保每个项目每题只有一条回答。

================================================================================
"""
from sqlalchemy import Column, Integer, String, Float, ForeignKey, UniqueConstraint
from database import Base


class AssessmentAnswer(Base):
    """
    评估回答。

    记录项目中单道题目的评估结果。
    """
    __tablename__ = "assessment_answer"
    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("assessment_project.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("question.id"), nullable=False)
    selected_level = Column(String(5))          # 沟通等级（A-F）
    target_level = Column(String(5))            # 目标等级（A-F）
    communication_content = Column(String(2000)) # 沟通内容
    company_status = Column(String(2000))       # 企业现状
    score = Column(Float)                       # 自动得分
    is_applicable = Column(Integer, default=1)  # 是否适用

    # 唯一约束：同一项目同一题目只有一条回答
    __table_args__ = (UniqueConstraint("project_id", "question_id"),)
