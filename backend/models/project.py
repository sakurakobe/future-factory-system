"""
================================================================================
数据库模型 - 评估项目
================================================================================
说明：
    定义评估项目的数据结构。
    每个项目代表对一家企业的完整诊断评估流程。
================================================================================
"""
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from database import Base


class AssessmentProject(Base):
    """
    评估项目。

    记录企业的基本信息和评估相关人员/时间。
    """
    __tablename__ = "assessment_project"
    id = Column(Integer, primary_key=True, autoincrement=True)
    company_name = Column(String(200), nullable=False)  # 企业名称
    company_type = Column(String(20))                   # 企业类型（通用/离散/流程）
    assessment_start_date = Column(String(20))          # 评估开始日期
    assessment_end_date = Column(String(20))            # 评估结束日期
    assessors = Column(String(500))                     # 评估人员
    created_at = Column(DateTime, server_default=func.now())   # 创建时间
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())  # 更新时间
    status = Column(String(20), default="in_progress")  # 状态（进行中/已完成）
