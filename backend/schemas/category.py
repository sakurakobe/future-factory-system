"""
================================================================================
Pydantic Schemas - 分类相关数据模型
================================================================================
说明：
    定义分类树的嵌套数据结构，用于 /api/categories/tree 接口的响应格式。

数据结构（四级嵌套）：
    CategoryTreeList
      └── categories: List[CategoryTree]    # 主要方面（如"赋能保障"）
            └── sub_categories: List[SubInCategory]   # 子类（如"技术支撑"）
                  └── sub_sub_categories: List[SubSubInCategory]  # 细项（如"新一代信息技术"）
                        └── questions: List[QuestionInCategory]   # 题目
                              └── options: List[LevelOption]      # 等级选项（A-F）

================================================================================
"""
from pydantic import BaseModel
from typing import List, Optional


class LevelOption(BaseModel):
    """
    单个等级选项。

    每道题目有 A-F 共 6 个等级选项，每个选项包含：
    - level: 等级标识（A/B/C/D/E/F）
    - score: 该等级对应的分值
    - description: 等级描述文字
    - target_level: 建议达到的等级
    """
    level: str
    score: float
    description: str
    target_level: str


class QuestionInCategory(BaseModel):
    """分类树中的题目节点。"""
    id: int
    sort_order: int
    title: str
    max_score: float
    industry_type: str
    is_multi_select: int
    options: List[LevelOption]


class SubSubInCategory(BaseModel):
    """分类树中的细项节点（三级分类，包含题目列表）。"""
    id: int
    sort_order: int
    name: str
    max_score: float
    questions: List[QuestionInCategory]


class SubInCategory(BaseModel):
    """分类树中的子类节点（二级分类，包含细项列表）。"""
    id: int
    sort_order: int
    name: str
    max_score: float
    description: Optional[str]
    sub_sub_categories: List[SubSubInCategory]


class CategoryTree(BaseModel):
    """分类树中的主要方面节点（一级分类，包含子类列表）。"""
    id: int
    sort_order: int
    name: str
    max_score: float
    description: Optional[str]
    sub_categories: List[SubInCategory]


class CategoryTreeList(BaseModel):
    """分类树根节点，包含所有主要方面。"""
    categories: List[CategoryTree]
