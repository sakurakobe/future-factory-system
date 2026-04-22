"""
================================================================================
评分计算服务
================================================================================
核心功能：
    根据用户选择的等级（A/B/C/D/E/F），自动计算每道题目的得分。

评分逻辑：
    - 每题有 6 个等级选项（A~F），每个选项对应不同的分值
    - 例如 A=0分, B=1分, C=2分, D=3分, E=4分, F=5分
    - 分值信息存储在题目的 options_json 字段中
    - 系统根据用户选择的等级查找对应分值，自动计算得分

使用场景：
    1. 用户在访谈页面选择"沟通等级"时，后端自动计算得分
    2. 前端选择等级时，通过 options_json 即时展示得分
    3. 批量保存时，后端重新计算并更新所有答案的得分

================================================================================
"""

import json
from typing import Optional
from sqlalchemy.orm import Session
from models.question import Question
from models.answer import AssessmentAnswer


def calculate_score(selected_level, question_id: int, db: Session) -> float:
    """
    根据选中等级自动计算得分。

    参数：
        selected_level: 用户选择的等级，如 "A"（单选）或 "A,B,C"（多选）
        question_id: 题目ID
        db: 数据库会话

    返回：
        对应等级分值之和（浮点数），如果没有选择等级则返回 0.0

    多选题：多个等级用逗号分隔，如 "A,B,C"，返回各选项分值之和
    """
    # 没有选择等级，返回0分
    if not selected_level:
        return 0.0

    # 查询题目信息
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        return 0.0

    # 从 JSON 字符串中解析等级选项列表
    options = json.loads(question.options_json)
    level_score_map = {opt["level"]: opt["score"] for opt in options}

    # 支持多选：逗号分隔多个等级（如 "A,B,C"）
    levels = [s.strip() for s in str(selected_level).split(",") if s.strip()]
    total = sum(level_score_map.get(level, 0) for level in levels)
    return total


def update_answer_score(answer: AssessmentAnswer, db: Session) -> float:
    """
    更新回答的 score 字段并返回新得分。

    当用户修改了选择等级时，调用此函数重新计算得分。

    参数：
        answer: 回答对象（已关联 question_id）
        db: 数据库会话

    返回：
        新计算的得分
    """
    score = calculate_score(answer.selected_level, answer.question_id, db)
    answer.score = score
    db.flush()
    return score
