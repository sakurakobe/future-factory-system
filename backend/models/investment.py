"""
================================================================================
数据库模型 - 投资项目
================================================================================
说明：
    管理评估项目的改造投资项目。
    投资项目分为四大类别：
    - necessary: 必要投入/改造项目
    - recommended: 建议投入项目
    - system_upgrade: 系统已有待优化项目
    - confirmed: 已明确投入项目
================================================================================
"""
from sqlalchemy import Column, Integer, String, Float, Text
from database import Base


class InvestmentItem(Base):
    """
    投资项目。

    每个项目属于四大类别之一，包含名称、说明和预算范围。
    """
    __tablename__ = "investment_item"
    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, nullable=False)   # 关联项目ID
    category = Column(String(50), nullable=False)  # 类别
    title = Column(String(200), nullable=False)    # 项目名称
    description = Column(Text)                     # 项目说明
    budget_min = Column(Float)                     # 最低预算（万元）
    budget_max = Column(Float)                     # 最高预算（万元）
    sort_order = Column(Integer, default=0)        # 排序序号
