"""
================================================================================
项目管理 API 路由
================================================================================
功能：
    提供评估项目的完整 CRUD（增删改查）操作。
    每个项目代表对一家企业的未来工厂建设诊断评估。

API 端点：
    GET    /api/projects              - 获取项目列表
    POST   /api/projects              - 创建新项目
    GET    /api/projects/{id}         - 获取项目详情
    PUT    /api/projects/{id}         - 更新项目信息
    DELETE /api/projects/{id}         - 删除项目

================================================================================
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.project import AssessmentProject
from schemas.project import ProjectCreate, ProjectUpdate, ProjectRead
from typing import List

router = APIRouter()


@router.get("", response_model=List[ProjectRead])
def list_projects(db: Session = Depends(get_db)):
    """
    获取所有评估项目列表。
    按创建时间倒序排列（最新的在前）。
    """
    return db.query(AssessmentProject).order_by(AssessmentProject.created_at.desc()).all()


@router.post("", response_model=ProjectRead)
def create_project(data: ProjectCreate, db: Session = Depends(get_db)):
    """
    创建新的评估项目。

    请求体示例：
    {
        "company_name": "浙江某某科技有限公司",
        "company_type": "通用",
        "assessment_start_date": "2026-04-20",
        "assessment_end_date": "2026-04-21",
        "assessors": "张三、李四"
    }
    """
    # 使用 model_dump() 将 Pydantic 模型转为字典，然后创建数据库记录
    project = AssessmentProject(**data.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)  # 刷新获取自增ID和默认值
    return project


@router.get("/{project_id}", response_model=ProjectRead)
def get_project(project_id: int, db: Session = Depends(get_db)):
    """
    根据ID获取项目详情。
    如果项目不存在，返回404错误。
    """
    project = db.query(AssessmentProject).filter(AssessmentProject.id == project_id).first()
    if not project:
        raise HTTPException(404, "项目不存在")
    return project


@router.put("/{project_id}", response_model=ProjectRead)
def update_project(project_id: int, data: ProjectUpdate, db: Session = Depends(get_db)):
    """
    更新项目信息（支持部分更新）。
    只更新请求体中提供的字段，未提供的字段保持不变。
    """
    project = db.query(AssessmentProject).filter(AssessmentProject.id == project_id).first()
    if not project:
        raise HTTPException(404, "项目不存在")
    # 只更新用户提供的字段（exclude_unset=True 忽略未设置的字段）
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(project, key, value)
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    """
    删除项目及其所有关联数据（回答、备注、补充信息、投资计划等）。
    注意：此操作不可恢复！
    """
    project = db.query(AssessmentProject).filter(AssessmentProject.id == project_id).first()
    if not project:
        raise HTTPException(404, "项目不存在")
    db.delete(project)
    db.commit()
    return {"ok": True}
