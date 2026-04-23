"""
Simple password authentication module.
Config file: auth_config.json (excluded from git)
Default password: future2024
"""
import hashlib
import json
import os
import secrets
import time
from typing import Optional

from config import BASE_DIR

AUTH_CONFIG_PATH = os.path.join(BASE_DIR, "auth_config.json")

# In-memory session store: token -> expiry_timestamp
_sessions: dict[str, float] = {}

TOKEN_TTL_HOURS = 24


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def _load_config() -> dict:
    if not os.path.exists(AUTH_CONFIG_PATH):
        return {}
    try:
        with open(AUTH_CONFIG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def _save_config(cfg: dict):
    with open(AUTH_CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(cfg, f, ensure_ascii=False, indent=2)


def _ensure_default():
    """Initialize with default password if no config exists."""
    if not os.path.exists(AUTH_CONFIG_PATH):
        cfg = {"password_hash": _hash_password("future2024")}
        _save_config(cfg)
        return cfg
    return _load_config()


def get_password_hash() -> str:
    cfg = _ensure_default()
    return cfg.get("password_hash", "")


def change_password(old: str, new: str) -> bool:
    if get_password_hash() != _hash_password(old):
        return False
    cfg = _ensure_default()
    cfg["password_hash"] = _hash_password(new)
    _save_config(cfg)
    return True


def verify_token(token: str) -> bool:
    """Check if a token is valid and not expired."""
    if not token or token not in _sessions:
        return False
    if time.time() > _sessions[token]:
        del _sessions[token]
        return False
    return True


def create_token() -> str:
    token = secrets.token_hex(24)
    _sessions[token] = time.time() + TOKEN_TTL_HOURS * 3600
    return token


def validate_password(password: str) -> bool:
    return _hash_password(password) == get_password_hash()


def cleanup_expired():
    """Remove expired sessions."""
    now = time.time()
    expired = [t for t, exp in _sessions.items() if now > exp]
    for t in expired:
        del _sessions[t]
