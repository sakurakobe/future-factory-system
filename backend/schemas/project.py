"""
================================================================================
Pydantic Schemas - 数据验证模型
================================================================================
说明：
    定义 API 请求和响应的数据格式，用于自动数据验证和文档生成。
    所有 schema 使用 Pydantic BaseModel，FastAPI 会自动进行类型检查和转换。

================================================================================
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ProjectCreate(BaseModel):
    """
    创建项目的请求体。

    必填字段：
        company_name: 企业名称

    可选字段：
        company_type: 企业类型（通用/离散/流程），默认"通用"
        assessment_start_date: 评估开始日期
        assessment_end_date: 评估结束日期
        assessors: 评估人员
    """
    company_name: str
    company_type: Optional[str] = "通用"
    assessment_start_date: Optional[str] = None
    assessment_end_date: Optional[str] = None
    assessors: Optional[str] = None


class ProjectUpdate(BaseModel):
    """
    更新项目的请求体。

    所有字段均为可选，只更新提供的字段（部分更新）。
    未提供的字段保持原值不变。
    """
    company_name: Optional[str] = None
    company_type: Optional[str] = None
    assessment_start_date: Optional[str] = None
    assessment_end_date: Optional[str] = None
    assessors: Optional[str] = None
    status: Optional[str] = None


class ProjectRead(BaseModel):
    """
    项目响应的数据格式。

    包含项目的完整信息，含自动生成的 id 和时间戳。
    from_attributes = True 允许从 SQLAlchemy 模型直接转换。
    """
    id: int
    company_name: str
    company_type: Optional[str]
    assessment_start_date: Optional[str]
    assessment_end_date: Optional[str]
    assessors: Optional[str]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    status: str

    class Config:
        from_attributes = True
