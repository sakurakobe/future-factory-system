"""
================================================================================
数据库模型 - 补充信息
================================================================================
说明：
    管理评估项目的补充信息，支持两种类型：
    - text: 文本补充说明
    - attachment: 附件文件上传
================================================================================
"""
from sqlalchemy import Column, Integer, String, Text
from database import Base


class SupplementaryInfo(Base):
    """
    补充信息。

    可以存储文本内容或文件附件的元数据。
    """
    __tablename__ = "supplementary_info"
    id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, nullable=False)   # 关联项目ID
    info_type = Column(String(50), nullable=False) # 类型：text 或 attachment
    title = Column(String(200))                    # 标题/原始文件名
    content = Column(Text)                         # 文本内容（text 类型时使用）
    file_path = Column(String(500))                # 文件路径（attachment 类型时使用）
