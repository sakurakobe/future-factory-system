"""
================================================================================
投资计划 API 路由
================================================================================
功能：
    管理评估项目的改造投资项目。
    投资项目分为四大类：
    1. necessary    - 必要投入/改造项目
    2. recommended  - 建议投入项目
    3. system_upgrade - 系统已有待优化项目
    4. confirmed    - 已明确投入项目

API 端点：
    GET    /api/projects/{pid}/investments      - 获取所有投资项目
    POST   /api/projects/{pid}/investments      - 创建投资项目
    PUT    /api/projects/{pid}/investments/{id} - 更新投资项目
    DELETE /api/projects/{pid}/investments/{id} - 删除投资项目

================================================================================
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.investment import InvestmentItem

router = APIRouter()


@router.get("/projects/{project_id}/investments")
def list_investments(project_id: int, db: Session = Depends(get_db)):
    """
    获取项目的所有投资项目。
    先按类别排序（必要/建议/待优化/已明确），再按排序字段排序。
    """
    items = db.query(InvestmentItem).filter(
        InvestmentItem.project_id == project_id
    ).order_by(InvestmentItem.category, InvestmentItem.sort_order).all()
    return [{"id": i.id, "category": i.category, "title": i.title, "description": i.description,
             "budget_min": i.budget_min, "budget_max": i.budget_max, "sort_order": i.sort_order} for i in items]


@router.post("/projects/{project_id}/investments")
def create_investment(project_id: int, data: dict, db: Session = Depends(get_db)):
    """
    创建新的投资项目。

    请求体示例：
    {
        "category": "necessary",
        "title": "MES生产执行系统",
        "description": "建设覆盖全厂的MES系统...",
        "budget_min": 50,
        "budget_max": 100,
        "sort_order": 1
    }
    """
    item = InvestmentItem(
        project_id=project_id,
        category=data.get("category", "necessary"),
        title=data["title"],
        description=data.get("description", ""),
        budget_min=data.get("budget_min"),
        budget_max=data.get("budget_max"),
        sort_order=data.get("sort_order", 0),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"id": item.id}


@router.put("/projects/{project_id}/investments/{item_id}")
def update_investment(project_id: int, item_id: int, data: dict, db: Session = Depends(get_db)):
    """
    更新投资项目信息。
    支持部分更新，只更新请求体中提供的字段。
    """
    item = db.query(InvestmentItem).filter(
        InvestmentItem.id == item_id,
        InvestmentItem.project_id == project_id
    ).first()
    if not item:
        raise HTTPException(404, "记录不存在")
    # 逐项更新提供的字段
    for key in ["category", "title", "description", "budget_min", "budget_max", "sort_order"]:
        if key in data:
            setattr(item, key, data[key])
    db.commit()
    return {"ok": True}


@router.delete("/projects/{project_id}/investments/{item_id}")
def delete_investment(project_id: int, item_id: int, db: Session = Depends(get_db)):
    """
    删除投资项目。
    """
    item = db.query(InvestmentItem).filter(
        InvestmentItem.id == item_id,
        InvestmentItem.project_id == project_id
    ).first()
    if not item:
        raise HTTPException(404, "记录不存在")
    db.delete(item)
    db.commit()
    return {"ok": True}
