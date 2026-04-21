"""
================================================================================
Pydantic Schemas - 报告相关数据模型
================================================================================
说明：
    定义得分汇总和雷达图数据的响应格式。
    用于 /api/projects/{id}/score-summary 接口。

数据结构：
    ScoreSummary（得分汇总）
      ├── total_score: 总分
      ├── total_max: 满分
      ├── percentage: 得分率
      ├── major_scores: List[MajorScore]    # 各大类得分
      └── radar_data: List[RadarDataPoint]  # 雷达图数据点

================================================================================
"""
from pydantic import BaseModel
from typing import List


class RadarDataPoint(BaseModel):
    """
    雷达图数据点（子类级别）。

    用于前端渲染雷达图，每个子类对应雷达图上的一个顶点。
    包含当前得分、满分、目标得分，方便用户对比差距。
    """
    name: str           # 子类名称（如"技术支撑"）
    score: float        # 当前得分
    max_score: float    # 满分
    percentage: float   # 得分率（百分比）
    target_score: float # 目标得分（按目标等级计算）


class MajorScore(BaseModel):
    """
    大类（方面）得分。

    用于得分汇总展示，如"赋能保障：28.92/65分（44.49%）"。
    """
    name: str           # 方面名称（如"赋能保障"）
    score: float        # 得分
    max_score: float    # 满分
    percentage: float   # 得分率


class ScoreSummary(BaseModel):
    """
    项目得分汇总（完整响应格式）。

    前端使用此数据进行：
    1. 总分展示（total_score / total_max, percentage）
    2. 各大类得分展示（major_scores 列表）
    3. 雷达图渲染（radar_data 数据点）
    """
    total_score: float         # 总分
    total_max: float           # 满分（500分）
    percentage: float          # 总得分率
    major_scores: List[MajorScore]  # 各大类得分列表
    radar_data: List[RadarDataPoint]  # 雷达图数据点列表
