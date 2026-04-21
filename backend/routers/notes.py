"""
================================================================================
大类备注 API 路由
================================================================================
功能：
    管理每个建设要素（如"赋能保障"）的整体备注。
    用于记录与企业整体沟通时的小组讨论要点。

API 端点：
    GET /api/projects/{pid}/notes/{major_id}  - 获取指定大类的备注
    PUT /api/projects/{pid}/notes/{major_id}  - 更新/创建指定大类的备注

================================================================================
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.note import MajorCategoryNote

router = APIRouter()


@router.get("/projects/{project_id}/notes/{major_id}")
def get_note(project_id: int, major_id: int, db: Session = Depends(get_db)):
    """
    获取指定项目、指定大类（方面）的整体备注内容。
    如果尚未创建备注，返回空字符串。
    """
    note = db.query(MajorCategoryNote).filter(
        MajorCategoryNote.project_id == project_id,
        MajorCategoryNote.major_category_id == major_id
    ).first()
    if note:
        return {"content": note.note_content}
    return {"content": ""}


@router.put("/projects/{project_id}/notes/{major_id}")
def update_note(project_id: int, major_id: int, data: dict, db: Session = Depends(get_db)):
    """
    更新或创建指定大类备注。

    请求体示例：
    { "content": "该企业信息化基础较好，但组织保障体系需完善..." }

    如果该大类尚无备注，会自动创建新记录；已有则更新内容。
    """
    note = db.query(MajorCategoryNote).filter(
        MajorCategoryNote.project_id == project_id,
        MajorCategoryNote.major_category_id == major_id
    ).first()
    if not note:
        note = MajorCategoryNote(project_id=project_id, major_category_id=major_id)
        db.add(note)
    note.note_content = data.get("content", "")
    db.commit()
    return {"ok": True}
