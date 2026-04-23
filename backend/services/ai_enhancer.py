"""
================================================================================
AI 增强服务 - OpenAI-compatible API
================================================================================
封装 AI 调用逻辑，使用 OpenAI-compatible 接口，支持各种兼容的 LLM 服务。
================================================================================
"""
import json
import os
from typing import Optional

import httpx

from config import AI_CONFIG_PATH


def _load_ai_config() -> dict:
    """读取 AI 配置"""
    if not os.path.exists(AI_CONFIG_PATH):
        return {}
    try:
        with open(AI_CONFIG_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return {}


def save_ai_config(base_url: str, api_key: str, model: str, enabled: bool = True) -> dict:
    """保存 AI 配置"""
    config = {
        "base_url": base_url,
        "api_key": api_key,
        "model": model,
        "enabled": enabled,
    }
    os.makedirs(os.path.dirname(AI_CONFIG_PATH), exist_ok=True)
    with open(AI_CONFIG_PATH, 'w', encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=False, indent=2)
    return config


def get_ai_status() -> dict:
    """获取 AI 配置状态（不返回 api_key）"""
    config = _load_ai_config()
    return {
        "configured": bool(config.get("api_key") and config.get("base_url")),
        "base_url": config.get("base_url", ""),
        "model": config.get("model", ""),
        "enabled": config.get("enabled", False),
    }


def get_models() -> list[str]:
    """获取可用模型列表"""
    config = _load_ai_config()
    if not config.get("api_key") or not config.get("base_url"):
        return []

    base_url = config["base_url"].rstrip("/")
    url = f"{base_url}/models"
    try:
        with httpx.Client(timeout=10) as client:
            resp = client.get(url, headers={"Authorization": f"Bearer {config['api_key']}"})
            if resp.status_code == 200:
                data = resp.json()
                models = []
                for m in data.get("data", []):
                    models.append(m.get("id", ""))
                return [m for m in models if m]
    except Exception:
        pass
    # 返回默认模型
    if config.get("model"):
        return [config["model"]]
    return []


def chat_completion(messages: list[dict], max_tokens: int = 2000) -> Optional[str]:
    """
    调用 OpenAI-compatible chat completion API。

    返回生成的文本，失败时返回 None。
    """
    config = _load_ai_config()
    if not config.get("api_key") or not config.get("base_url"):
        return None
    if not config.get("enabled", False):
        return None

    base_url = config["base_url"].rstrip("/")
    model = config.get("model", "gpt-3.5-turbo")

    try:
        with httpx.Client(timeout=60) as client:
            resp = client.post(
                f"{base_url}/chat/completions",
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": max_tokens,
                },
                headers={
                    "Authorization": f"Bearer {config['api_key']}",
                    "Content-Type": "application/json",
                },
            )
            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"].get("content", "")
                return content.strip()
    except Exception:
        pass
    return None


def generate_status_analysis(
    requirement_text: str,
    status_data: list[dict],
    company_name: str,
) -> Optional[str]:
    """
    使用 AI 生成企业现状与差距分析。

    Args:
        requirement_text: 要求解读文本
        status_data: 企业现状数据，格式: [{"sub_sub_name": "...", "question_title": "...", "company_status": "...", "score": 0}, ...]
        company_name: 企业名称

    Returns:
        AI 生成的叙述性分析文本，失败返回 None
    """
    # 构建简洁的企业数据摘要
    data_parts = []
    for item in status_data:
        part = f"[{item['sub_sub_name']}] {item['question_title']}: {item.get('company_status', '') or item.get('communication_content', '') or '无记录'}"
        data_parts.append(part)

    status_summary = "\n".join(data_parts[:30])  # 限制条目数

    prompt = (
        f"你是一位专业的未来工厂诊断评估分析师。"
        f'请根据以下评估数据，生成一段专业的"企业现状与差距分析"。'
        f"要求：\n"
        f"1. 使用专业、客观的叙述性语言\n"
        f"2. 按能力子域分段，突出亮点和短板\n"
        f"3. 指出与未来工厂标准的差距\n"
        f"4. 控制在500字以内\n"
        f"5. 直接输出分析文本，不要加标题或前缀\n\n"
        f"企业名称：{company_name}\n\n"
        f"要求解读：\n{requirement_text}\n\n"
        f"企业评估数据：\n{status_summary}"
    )

    return chat_completion([{"role": "user", "content": prompt}])


def generate_suggestion(
    question_title: str,
    company_status: str,
    current_level: str,
    target_level: str,
    level_descriptions: list[dict],
) -> Optional[str]:
    """
    使用 AI 生成专业的改进建议。

    Args:
        question_title: 题目名称
        company_status: 企业现状
        current_level: 当前等级
        target_level: 目标等级
        level_descriptions: 当前等级到目标等级之间的等级描述

    Returns:
        AI 生成的改进建议，失败返回 None
    """
    desc_text = "\n".join([
        f"{d['level']}级({d['score']}分): {d['description']}"
        for d in level_descriptions
    ])

    prompt = (
        f"你是一位专业的未来工厂诊断评估分析师。"
        f'请根据以下信息，生成一条简洁的"对标未来工厂建议的提升点"。\n'
        f"要求：\n"
        f"1. 结合企业现状和目标等级之间的差距\n"
        f"2. 给出具体的改进建议和方向\n"
        f"3. 简洁明了，控制在150字以内\n"
        f"4. 直接输出建议文本，不要加前缀\n\n"
        f"评测题目：{question_title}\n"
        f"企业现状：{company_status or '无记录'}\n"
        f"当前等级：{current_level}\n"
        f"目标等级：{target_level}\n\n"
        f"等级标准：\n{desc_text}"
    )

    return chat_completion([{"role": "user", "content": prompt}], max_tokens=500)
