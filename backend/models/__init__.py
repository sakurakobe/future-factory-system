"""
================================================================================
数据库模型统一导出
================================================================================
说明：
    将所有 ORM 模型集中导出，方便其他模块统一引用。
    所有模型必须在导入后注册到 Base.metadata，才能被 SQLAlchemy 识别。

模型列表：
    - MajorCategory: 主要方面（一级分类）
    - SubCategory: 子类（二级分类）
    - SubSubCategory: 细项（三级分类）
    - Question: 评估题目
    - AssessmentProject: 评估项目
    - AssessmentAnswer: 访谈回答
    - MajorCategoryNote: 大类备注
    - SupplementaryInfo: 补充信息
    - InvestmentItem: 投资项目
================================================================================
"""
from models.category import MajorCategory, SubCategory, SubSubCategory
from models.question import Question
from models.project import AssessmentProject
from models.answer import AssessmentAnswer
from models.note import MajorCategoryNote
from models.supplementary import SupplementaryInfo
from models.investment import InvestmentItem

__all__ = [
    "MajorCategory", "SubCategory", "SubSubCategory", "Question",
    "AssessmentProject", "AssessmentAnswer", "MajorCategoryNote",
    "SupplementaryInfo", "InvestmentItem",
]
