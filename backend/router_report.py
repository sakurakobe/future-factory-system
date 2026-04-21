"""
================================================================================
报告生成 API 路由
================================================================================
功能：
    1. 获取项目得分汇总（含雷达图数据）
    2. 生成诊断评估报告（Word文档）
    3. 下载 Word 报告文件
    4. 导出 Excel 评估结果

API 端点：
    GET  /api/projects/{pid}/score-summary      - 获取得分汇总/雷达图数据
    POST /api/projects/{pid}/report/generate    - 生成 Word 报告
    GET  /api/projects/{pid}/report/download    - 下载 Word 报告
    GET  /api/projects/{pid}/excel/export       - 导出 Excel 评估结果

================================================================================
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database import get_db
from models.project import AssessmentProject
from services.summary import get_score_summary
from services.report_generator import ReportGenerator
from services.excel_export import export_excel
import os

router = APIRouter()

# 报告文件存储目录
REPORT_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(REPORT_DIR, exist_ok=True)


@router.get("/projects/{project_id}/score-summary")
def get_summary(project_id: int, db: Session = Depends(get_db)):
    """获取得分汇总（含雷达图数据）"""
    project = db.query(AssessmentProject).filter(AssessmentProject.id == project_id).first()
    if not project:
        raise HTTPException(404, "项目不存在")
    return get_score_summary(project_id, db)


@router.post("/projects/{project_id}/report/generate")
def generate_report(project_id: int, db: Session = Depends(get_db)):
    """
    生成诊断评估报告（Word文档）。

    报告生成流程：
    1. 读取项目信息和所有回答数据
    2. 使用 ReportGenerator 按模板生成 DOCX 文件
    3. 保存到 uploads/ 目录
    4. 返回文件名，前端通过 download 接口下载
    """
    project = db.query(AssessmentProject).filter(AssessmentProject.id == project_id).first()
    if not project:
        raise HTTPException(404, "项目不存在")

    filename = f"报告_{project.company_name}.docx"
    filepath = os.path.join(REPORT_DIR, filename)

    generator = ReportGenerator(project, db)
    generator.generate(filepath)

    return {"filename": filename, "message": "报告生成成功"}


@router.get("/projects/{project_id}/report/download")
def download_report(project_id: int, db: Session = Depends(get_db)):
    """
    下载诊断评估报告（Word文档）。

    如果报告尚未生成，会自动先生成再返回文件。
    """
    project = db.query(AssessmentProject).filter(AssessmentProject.id == project_id).first()
    if not project:
        raise HTTPException(404, "项目不存在")

    filename = f"报告_{project.company_name}.docx"
    filepath = os.path.join(REPORT_DIR, filename)

    # 如果报告不存在，先生成
    if not os.path.exists(filepath):
        generator = ReportGenerator(project, db)
        generator.generate(filepath)

    return FileResponse(
        filepath,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=f"{project.company_name}_未来工厂诊断评估报告.docx",
    )


@router.get("/projects/{project_id}/excel/export")
def export_excel_report(project_id: int, db: Session = Depends(get_db)):
    """
    导出 Excel 评估结果。

    导出内容：
    - 分类层级（方面、子类、细项）
    - 评测题目
    - 当前等级、当前得分、满分
    - 目标等级、目标分值
    - 企业现状、沟通内容、改进建议

    根据项目的 company_type 自动过滤 离散/流程 行业专属题目。
    """
    project = db.query(AssessmentProject).filter(AssessmentProject.id == project_id).first()
    if not project:
        raise HTTPException(404, "项目不存在")

    try:
        filepath, filename = export_excel(project_id, db)
    except Exception as e:
        raise HTTPException(500, f"Excel 导出失败: {str(e)}")

    return FileResponse(
        filepath,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=f"{project.company_name}_未来工厂评估结果.xlsx",
    )
