"""
================================================================================
数据库初始化脚本 - XLSX 题库导入
================================================================================
用途：
    将题库 XLSX 文件中的数据导入到 SQLite 数据库。
    包含：3大方面 → 14子类 → 44细项 → 105道题目

数据结构：
    XLSX 表格格式（未来工厂标准诊断评估题库.xlsx）：
    - A列：主要方面（如"1.总体架构"）
    - B列：子类（如"1.技术支撑"）
    - C列：二级分类（如"1.新一代信息技术"）
    - D列：等级标签（通用/数字化车间/智能工厂/未来工厂）
    - H列：题目文字（仅在每道题第一行出现）
    - I列：等级（A/B/C/D/E/F）
    - J列：等级描述
    - K列：对应分值
    - L列：应达等级

运行方式：
    # 方式1：直接运行
    cd backend
    python seed/init_db.py

    # 方式2：在 Python 中导入调用
    from seed.init_db import init
    init()

注意事项：
    - 运行前请确保 config.py 中的 XLSX_PATH 指向正确的题库文件
    - 重复运行会清除已有数据并重新导入
    - 导入后各分类的 max_score 会自动根据题目分值计算
================================================================================
"""

import sys
import os

# 将 backend 目录加入 Python 模块搜索路径
# 这样可以直接从 services、models 等子目录导入模块
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy.orm import Session
from services.xlsx_importer import import_xlsx
from database import engine, SessionLocal, Base
from config import UPLOAD_DIR


def init():
    """
    初始化数据库的完整流程：
    1. 创建所有数据库表
    2. 创建上传文件目录
    3. 从 XLSX 文件导入题库数据
    """
    # 第一步：创建所有数据库表（如果表已存在则跳过）
    Base.metadata.create_all(bind=engine)

    # 第二步：确保上传文件目录存在
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # 第三步：导入题库数据
    db: Session = SessionLocal()
    try:
        print("正在导入XLSX题库数据...")
        import_xlsx(db)
        print("题库导入完成！")
    except Exception as e:
        print(f"导入失败: {e}")
        print("请检查：")
        print(f"1. XLSX文件是否存在: {os.environ.get('XLSX_PATH', '使用默认路径')}")
        print(f"2. 默认路径: D:/code/文件内容/未来工厂标准诊断评估题库.xlsx")
    finally:
        db.close()


if __name__ == "__main__":
    init()
