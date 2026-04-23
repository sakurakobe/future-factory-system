"""
================================================================================
未来工厂诊断评估系统 - FastAPI 后端入口
================================================================================
说明：
    本项目是浙江省"未来工厂"建设诊断评估系统的后端服务。
    提供 RESTful API 供前端调用，支持题库管理、访谈录入、评分计算、
    报告生成等功能。

启动方式：
    python -m uvicorn main:app --reload --port 8000
    或在项目根目录运行：
    python -m uvicorn main:app --reload --port 8000 --app-dir backend

API 文档：
    启动后访问 http://localhost:8000/docs 查看自动生成的 Swagger 文档
    访问 http://localhost:8000/redoc 查看 ReDoc 文档

================================================================================
"""

from fastapi import FastAPI
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine, Base, SessionLocal
from sqlalchemy import inspect
import os
from config import UPLOAD_DIR, XLSX_PATH

# ========================================
# 导入各业务模块的路由
# ========================================
from routers.categories import router as categories_router
from routers.projects import router as projects_router
from routers.answers import router as answers_router
from routers.notes import router as notes_router
from routers.supplementary import router as supplementary_router
from routers.investments import router as investments_router
from router_report import router as report_router
from routers.question import router as question_router
from router_ai import router as ai_router

# ========================================
# 创建 FastAPI 应用实例
# ========================================
app = FastAPI(
    title="未来工厂诊断评估系统",
    version="1.0.0",
    description="浙江省未来工厂建设诊断评估系统后端 API",
)

# ========================================
# 配置 CORS 跨域支持
# 允许前端（Vite dev server）调用后端 API
# ========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # 开发环境允许所有来源
    allow_credentials=True,
    allow_methods=["*"],        # 允许所有 HTTP 方法
    allow_headers=["*"],        # 允许所有请求头
)

# ========================================
# 简单密码认证中间件
# 除登录接口和健康检查外，所有 /api/* 请求需要携带有效 token
# ========================================
from auth_module import verify_token

_UNAUTH_PATHS = {
    "/api/health",
    "/api/auth/login",
}

@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    path = request.url.path
    # Allow health check, auth endpoints, static files, and docs through
    if (path in _UNAUTH_PATHS
            or path.startswith("/api/auth/")
            or path.startswith("/uploads/")
            or path in ("/docs", "/redoc", "/openapi.json")):
        return await call_next(request)
    # Check auth token for all other /api/* routes
    if path.startswith("/api/"):
        auth = request.headers.get("Authorization", "")
        token = auth.replace("Bearer ", "", 1) if auth.startswith("Bearer ") else auth
        if not token or not verify_token(token):
            return JSONResponse(
                status_code=401,
                content={"detail": "未认证或 token 已过期，请重新登录"},
            )
    return await call_next(request)

# ========================================
# 创建上传文件存储目录
# 挂载为静态文件服务，方便前端访问上传的附件
# ========================================
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ========================================
# 注册各业务模块的路由
# 每个路由处理一组相关的 API 端点
# ========================================
app.include_router(categories_router, prefix="/api/categories", tags=["分类管理"])
app.include_router(projects_router, prefix="/api/projects", tags=["项目管理"])
app.include_router(answers_router, prefix="/api", tags=["访谈回答"])
app.include_router(notes_router, prefix="/api", tags=["分类备注"])
app.include_router(supplementary_router, prefix="/api", tags=["补充信息"])
app.include_router(investments_router, prefix="/api", tags=["投资计划"])
app.include_router(report_router, prefix="/api", tags=["报告生成"])
app.include_router(question_router, prefix="/api", tags=["题目管理"])
app.include_router(ai_router, prefix="/api", tags=["AI 配置"])


# ========================================
# 应用启动时的初始化事件
# 确保所有数据库表都已创建，且题库数据已导入
# ========================================
@app.on_event("startup")
async def startup():
    """应用启动时自动执行：
    1. 创建所有数据库表
    2. 如果题库为空，自动从 XLSX 导入
    """
    Base.metadata.create_all(bind=engine)

    # 检查是否已有题目数据
    db = SessionLocal()
    try:
        from models.question import Question
        count = db.query(Question).count()
        if count == 0 and os.path.exists(XLSX_PATH):
            print("检测到题库为空，正在从 XLSX 导入数据...")
            from services.xlsx_importer import import_xlsx
            import_xlsx(db)
            print(f"题库导入完成！共 {db.query(Question).count()} 道题目。")
        else:
            print(f"题库已存在 {count} 道题目。")
    except Exception as e:
        print(f"题库初始化跳过: {e}")
    finally:
        db.close()


# ========================================
# 登录接口
# POST /api/auth/login — 验证密码，返回 token
# ========================================
from pydantic import BaseModel
from auth_module import validate_password, create_token, change_password

class LoginRequest(BaseModel):
    password: str

class ChangePasswordRequest(BaseModel):
    old: str
    new: str

@app.post("/api/auth/login")
async def login(req: LoginRequest):
    if not validate_password(req.password):
        return JSONResponse(status_code=401, content={"detail": "密码错误"})
    token = create_token()
    return {"token": token}

@app.post("/api/auth/change-password")
async def change_password(req: ChangePasswordRequest):
    if not change_password(req.old, req.new):
        return JSONResponse(status_code=401, content={"detail": "原密码错误"})
    return {"message": "密码已修改"}

# ========================================
# 健康检查接口
# 用于判断后端服务是否正常运行
# 访问：GET /api/health
# 返回：{"status": "ok"}
# ========================================
@app.get("/api/health")
def health():
    """健康检查：判断服务是否在线"""
    return {"status": "ok"}
