"""
================================================================================
数据库模型 - 评估题目
================================================================================
说明：
    定义105道评估题目的数据结构。
    每道题目归属于一个细项（三级分类），包含A-F六个等级选项。

核心字段：
    options_json: 存储6个等级选项的JSON数组，每个选项包含：
      - level: 等级标识（A/B/C/D/E/F）
      - score: 该等级对应的分值
      - description: 等级描述文字
      - target_level: 建议达到的等级

    level_labels: 等级标签的JSON映射（D/E/F/G列的标题）

================================================================================
"""
from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Question(Base):
    """
    评估题目（共105道）。

    每道题有6个等级选项（A-F），分值信息存储在 options_json 中。
    """
    __tablename__ = "question"
    id = Column(Integer, primary_key=True, autoincrement=True)
    sub_sub_category_id = Column(Integer, ForeignKey("sub_sub_category.id"), nullable=False)
    sort_order = Column(Integer, nullable=False)      # 在细项内的排序
    title = Column(String(500), nullable=False)       # 题目文字
    max_score = Column(Float, nullable=False)         # 最高等级对应的分值
    industry_type = Column(String(20), default="通用") # 行业类型（通用/离散/流程）
    is_multi_select = Column(Integer, default=0)      # 是否多选（预留）
    responsible_dept = Column(String(100), default="") # 责任部门（用于按部门筛选题目）
    level_labels = Column(Text)                       # 等级标签映射（JSON）
    options_json = Column(Text, nullable=False)       # 等级选项（A-F，JSON格式）

    # 关联细项
    sub_sub_category = relationship("SubSubCategory", back_populates="questions")
