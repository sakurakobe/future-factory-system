"""
================================================================================
数据库配置模块
================================================================================
说明：
    配置 SQLAlchemy 数据库连接，使用 SQLite 作为轻量级数据库。
    提供 get_db() 函数用于 FastAPI 依赖注入，
    每次请求自动创建和关闭数据库会话。

使用方式：
    在路由函数中通过 Depends(get_db) 注入数据库会话：

    @router.get("/items")
    def get_items(db: Session = Depends(get_db)):
        return db.query(Item).all()
================================================================================
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from config import DB_PATH

# ========================================
# 创建 SQLite 数据库引擎
# connect_args 中的 check_same_thread=False 允许多线程访问同一个连接
# （FastAPI 在多线程环境下运行时必须设置此项）
# ========================================
engine = create_engine(
    f"sqlite:///{DB_PATH}",
    connect_args={"check_same_thread": False}
)

# ========================================
# 创建数据库会话工厂
# autocommit=False: 需要手动提交事务
# autoflush=False: 提交前不自动刷新变更到数据库
# ========================================
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ========================================
# 声明式基类
# 所有 ORM 模型都必须继承此 Base 类
# ========================================
Base = declarative_base()


# ========================================
# 数据库会话依赖注入函数
# FastAPI 会在每次请求开始时调用此函数创建会话，
# 请求结束后自动关闭会话
# ========================================
def get_db():
    """
    获取数据库会话的依赖注入函数。
    每个请求获取独立的会话，请求结束后自动关闭。
    在路由中通过 Depends(get_db) 使用。
    """
    db = SessionLocal()
    try:
        yield db  # 将数据库会话传递给请求处理函数
    finally:
        db.close()  # 请求结束后确保关闭数据库连接
