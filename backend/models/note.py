"""
================================================================================
数据库模型 - 大类备注
================================================================================
说明：
    记录每个项目在每个主要方面（大类）的整体备注。
    用于存放企业整体沟通时的小组讨论要点。
================================================================================
"""
from sqlalchemy import Column, Integer, String, Text
from database import Base


class MajorCategoryNote(Base):
    """
    大类整体备注。

    每个项目在每个主要方面（如"赋能保障"）下有一条备注记录。
    """
    __tablename__ = "major_category_note"
    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, nullable=False)         # 关联项目ID
    major_category_id = Column(Integer, nullable=False)  # 关联大类ID
    note_content = Column(Text)                          # 备注内容
