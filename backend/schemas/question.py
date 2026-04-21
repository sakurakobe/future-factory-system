"""
================================================================================
Pydantic Schemas - 题目和回答相关数据模型
================================================================================
说明：
    定义题目查询和回答的数据格式。
    主要用于分类树接口中的题目数据展示。

================================================================================
"""
from pydantic import BaseModel
from typing import List, Optional


class LevelOption(BaseModel):
    """
    单个等级选项。

    每道题目有 A-F 共 6 个等级选项，每个选项包含等级标识、分值、描述等。
    """
    level: str
    score: float
    description: str
    target_level: str


class QuestionRead(BaseModel):
    """题目查询返回的数据格式（含等级选项）。"""
    id: int
    sub_sub_category_id: int
    sort_order: int
    title: str
    max_score: float
    industry_type: str
    is_multi_select: int
    level_labels: Optional[str]
    options: List[LevelOption]

    class Config:
        from_attributes = True


class QuestionUpdate(BaseModel):
    """题目更新请求体（部分更新）。"""
    selected_level: Optional[str] = None
    target_level: Optional[str] = None
    communication_content: Optional[str] = None
    company_status: Optional[str] = None
    is_applicable: Optional[bool] = None


class AnswerRead(BaseModel):
    """回答查询返回的数据格式（含题目信息）。"""
    id: int
    question: QuestionRead
    selected_level: Optional[str]
    target_level: Optional[str]
    communication_content: Optional[str]
    company_status: Optional[str]
    score: Optional[float]
    is_applicable: int

    class Config:
        from_attributes = True


class AnswerBulkItem(BaseModel):
    """批量更新中单个题目的回答数据。"""
    question_id: int
    selected_level: Optional[str] = None
    target_level: Optional[str] = None
    communication_content: Optional[str] = None
    company_status: Optional[str] = None
    is_applicable: Optional[bool] = None


class AnswerBulkUpdate(BaseModel):
    """批量更新请求体（包含多题回答数组）。"""
    answers: List[AnswerBulkItem]
