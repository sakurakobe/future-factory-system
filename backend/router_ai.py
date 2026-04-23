"""
AI 配置路由
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services import ai_enhancer

router = APIRouter()


class AISettingsRequest(BaseModel):
    base_url: str
    api_key: str
    model: str
    enabled: bool = True


class AITestRequest(BaseModel):
    base_url: str
    api_key: str


@router.get("/ai/status")
def get_ai_status():
    """获取 AI 配置状态"""
    return ai_enhancer.get_ai_status()


@router.post("/ai/settings")
def save_ai_settings(req: AISettingsRequest):
    """保存 AI 配置"""
    ai_enhancer.save_ai_config(
        base_url=req.base_url,
        api_key=req.api_key,
        model=req.model,
        enabled=req.enabled,
    )
    return {"message": "AI 配置已保存"}


@router.post("/ai/test")
def test_ai_connection(req: AITestRequest):
    """
    测试 AI 连接（不保存配置）。
    直接尝试调用 OpenAI-compatible /models 接口。
    """
    base_url = req.base_url.rstrip("/")
    url = f"{base_url}/models"

    try:
        import httpx
        with httpx.Client(timeout=10) as client:
            resp = client.get(
                url,
                headers={"Authorization": f"Bearer {req.api_key}"},
            )
            if resp.status_code == 200:
                data = resp.json()
                models = [m.get("id", "") for m in data.get("data", []) if m.get("id")]
                return {
                    "success": True,
                    "message": "连接成功",
                    "models": models[:50],
                }
            else:
                return {
                    "success": False,
                    "message": f"服务器返回状态码: {resp.status_code}",
                    "detail": resp.text[:200] if resp.text else "",
                    "models": [],
                }
    except httpx.ConnectError as e:
        return {
            "success": False,
            "message": f"连接失败: 无法连接到 {base_url}",
            "detail": str(e)[:200],
            "models": [],
        }
    except httpx.TimeoutException:
        return {
            "success": False,
            "message": f"连接超时: {base_url} 未在10秒内响应",
            "detail": "",
            "models": [],
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"连接失败: {str(e)}",
            "detail": "",
            "models": [],
        }


@router.get("/ai/models")
def get_models():
    """获取已保存配置的可用模型列表"""
    models = ai_enhancer.get_models()
    if not models:
        status = ai_enhancer.get_ai_status()
        if not status.get("configured"):
            raise HTTPException(status_code=400, detail="AI 未配置，请先保存配置")
    return {"models": models}
