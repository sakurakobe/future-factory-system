"""
================================================================================
Pydantic Schemas - 题目和回答相关数据模型
================================================================================
说明：
    定义题目查询、回答更新的数据格式。

核心概念：
    - AnswerUpdate: 单题更新的请求格式（部分更新）
    - AnswerBulkUpdate: 批量更新的请求格式（多题一起保存）
    - 两者的字段都是可选的，只更新提供的字段

================================================================================
"""
from pydantic import BaseModel
from typing import Optional, List


class AnswerUpdate(BaseModel):
    """
    更新单题回答的请求体。

    支持更新：
    - selected_level: 沟通等级（企业当前达到的等级，A-F）
    - target_level: 目标等级（企业希望达到的等级）
    - communication_content: 沟通内容（与企业沟通的要点记录）
    - company_status: 企业现状（企业当前实际情况描述）
    - is_applicable: 是否适用（标记该题是否适用于当前企业）

    所有字段均为可选，只更新提供的字段。
    """
    selected_level: Optional[str] = None
    target_level: Optional[str] = None
    communication_content: Optional[str] = None
    company_status: Optional[str] = None
    is_applicable: Optional[bool] = None


class AnswerBulkItem(BaseModel):
    """
    批量更新中单个题目的回答数据。

    用于一次性保存多道题目的场景，减少 API 调用次数。
    question_id 是必填的，其他字段均为可选。
    """
    question_id: int
    selected_level: Optional[str] = None
    target_level: Optional[str] = None
    communication_content: Optional[str] = None
    company_status: Optional[str] = None
    is_applicable: Optional[bool] = None


class AnswerBulkUpdate(BaseModel):
    """
    批量更新的请求体。

    请求体示例：
    {
        "answers": [
            {"question_id": 1, "selected_level": "C", "company_status": "已实现"},
            {"question_id": 2, "selected_level": "D", "communication_content": "..."}
        ]
    }
    """
    answers: List[AnswerBulkItem]
