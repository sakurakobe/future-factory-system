"""
================================================================================
数据库模型 - 三级分类体系
================================================================================
说明：
    定义"主要方面 → 子类 → 细项"三级分类结构。
    105道评估题目归属于最底层的"细项"。

数据层级：
    MajorCategory (3个): 如"赋能保障"、"基础支撑"、"应用场景"
      └── SubCategory (14个): 如"技术支撑"、"体系保障"
            └── SubSubCategory (44个): 如"新一代信息技术"、"生产计划"

max_score 字段：
    每个分类的 max_score 由系统自动计算（其下所有题目分值之和），
    导入题库后自动更新，无需手动维护。

================================================================================
"""
from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class MajorCategory(Base):
    """
    主要方面（一级分类，共3个）。

    对应"赋能保障"、"基础支撑"、"应用场景"三个大类。
    """
    __tablename__ = "major_category"
    id = Column(Integer, primary_key=True, autoincrement=True)
    sort_order = Column(Integer, nullable=False)          # 排序序号
    name = Column(String(100), nullable=False)            # 如"赋能保障"
    max_score = Column(Float, nullable=False, default=0)  # 自动计算
    description = Column(String(500))                     # 分类描述

    # 关联子分类（按排序字段排序）
    sub_categories = relationship("SubCategory", back_populates="major_category", order_by="SubCategory.sort_order")


class SubCategory(Base):
    """
    子类（二级分类，共14个）。

    属于某个主要方面，如"技术支撑"属于"赋能保障"。
    """
    __tablename__ = "sub_category"
    id = Column(Integer, primary_key=True, autoincrement=True)
    major_category_id = Column(Integer, ForeignKey("major_category.id"), nullable=False)
    sort_order = Column(Integer, nullable=False)
    name = Column(String(100), nullable=False)
    max_score = Column(Float, nullable=False, default=0)
    description = Column(String(500))

    # 双向关联
    major_category = relationship("MajorCategory", back_populates="sub_categories")
    sub_sub_categories = relationship("SubSubCategory", back_populates="sub_category", order_by="SubSubCategory.sort_order")


class SubSubCategory(Base):
    """
    细项（三级分类，共44个）。

    属于某个子类，是题目的直接归属分类，如"新一代信息技术"。
    """
    __tablename__ = "sub_sub_category"
    id = Column(Integer, primary_key=True, autoincrement=True)
    sub_category_id = Column(Integer, ForeignKey("sub_category.id"), nullable=False)
    sort_order = Column(Integer, nullable=False)
    name = Column(String(100), nullable=False)
    max_score = Column(Float, nullable=False, default=0)
    description = Column(String(500))

    # 双向关联
    sub_category = relationship("SubCategory", back_populates="sub_sub_categories")
    questions = relationship("Question", back_populates="sub_sub_category", order_by="Question.sort_order")
