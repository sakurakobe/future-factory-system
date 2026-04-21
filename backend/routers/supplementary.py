"""
================================================================================
补充信息 API 路由
================================================================================
功能：
    管理评估项目的补充信息，包括：
    1. 文本补充说明（如额外备注）
    2. 附件文件上传（如企业工艺流程图、车间布局图等）

API 端点：
    GET    /api/projects/{pid}/supplementary      - 获取所有补充信息
    POST   /api/projects/{pid}/supplementary      - 创建文本补充信息
    POST   /api/projects/{pid}/upload             - 上传附件文件
    DELETE /api/projects/{pid}/supplementary/{id} - 删除补充信息（同时删除关联文件）

文件上传说明：
    - 上传的文件保存在 backend/uploads/ 目录下
    - 文件名使用 UUID 重命名，避免冲突
    - 原始文件名保存在数据库的 title 字段中
    - 通过 /uploads/{filename} 路径可以访问已上传的文件

================================================================================
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from models.supplementary import SupplementaryInfo
from config import UPLOAD_DIR
import os
import uuid

router = APIRouter()


@router.get("/projects/{project_id}/supplementary")
def list_supplementary(project_id: int, db: Session = Depends(get_db)):
    """
    获取项目的所有补充信息（按ID排序）。
    返回包含：类型（文本/附件）、标题、内容、文件路径。
    """
    items = db.query(SupplementaryInfo).filter(
        SupplementaryInfo.project_id == project_id
    ).order_by(SupplementaryInfo.id).all()
    return [{"id": i.id, "info_type": i.info_type, "title": i.title, "content": i.content, "file_path": i.file_path} for i in items]


@router.post("/projects/{project_id}/supplementary")
def create_supplementary(project_id: int, data: dict, db: Session = Depends(get_db)):
    """
    创建文本类型的补充信息。

    请求体示例：
    {
        "info_type": "text",
        "title": "补充说明",
        "content": "企业的数据安全管理体系还需加强..."
    }
    """
    item = SupplementaryInfo(
        project_id=project_id,
        info_type=data.get("info_type", "text"),
        title=data.get("title", ""),
        content=data.get("content", ""),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"id": item.id}


@router.post("/projects/{project_id}/upload")
async def upload_file(project_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    上传附件文件。

    上传流程：
    1. 生成唯一的文件名（UUID）避免冲突
    2. 保存文件到 uploads/ 目录
    3. 在数据库中记录文件信息（类型=attachment）
    4. 返回文件名和原始名称，前端可通过 /uploads/{filename} 访问
    """
    # 保留原始文件扩展名
    ext = os.path.splitext(file.filename)[1] if file.filename else ""
    # 使用 UUID 生成唯一文件名，避免文件名冲突
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    # 异步读取文件内容并写入磁盘
    with open(filepath, "wb") as f:
        content = await file.read()
        f.write(content)

    # 在数据库中创建附件记录
    item = SupplementaryInfo(
        project_id=project_id,
        info_type="attachment",
        title=file.filename or filename,  # title 保存原始文件名
        file_path=filename,                # file_path 保存服务器上的实际文件名
    )
    db.add(item)
    db.commit()
    return {"id": item.id, "filename": filename, "original_name": file.filename}


@router.delete("/projects/{project_id}/supplementary/{item_id}")
def delete_supplementary(project_id: int, item_id: int, db: Session = Depends(get_db)):
    """
    删除补充信息。
    如果是附件类型，同时删除服务器上的物理文件。
    """
    item = db.query(SupplementaryInfo).filter(
        SupplementaryInfo.id == item_id,
        SupplementaryInfo.project_id == project_id
    ).first()
    if not item:
        raise HTTPException(404, "记录不存在")
    # 如果是附件，删除物理文件
    if item.file_path:
        filepath = os.path.join(UPLOAD_DIR, item.file_path)
        if os.path.exists(filepath):
            os.remove(filepath)
    db.delete(item)
    db.commit()
    return {"ok": True}
