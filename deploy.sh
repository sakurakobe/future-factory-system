#!/bin/bash
# ============================================================
# 未来工厂诊断评估系统 - 部署到阿里云服务器
# ============================================================
# 用法: bash deploy.sh
# 部署目录: ~/future-factory-system
# 端口: 前端 8080, 后端 8000
# 访问: http://121.41.168.197:8080
# ============================================================

set -e

DEPLOY_DIR="$HOME/future-factory-system"
echo "=== 开始部署未来工厂诊断评估系统 ==="
echo "部署目录: $DEPLOY_DIR"

# ---- 后端 ----
echo "[1/4] 设置后端环境..."
mkdir -p "$DEPLOY_DIR/backend"
cd "$DEPLOY_DIR/backend"

# 创建虚拟环境
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt

# ---- 前端 ----
echo "[2/4] 构建前端..."
cd "$DEPLOY_DIR/frontend"
npm install
npm run build

# ---- 启动后端 ----
echo "[3/4] 启动后端 (端口 8000)..."
cd "$DEPLOY_DIR/backend"
# 停止旧进程
pkill -f "uvicorn main:app" 2>/dev/null || true
# 后台启动
source venv/bin/activate
nohup uvicorn main:app --host 0.0.0.0 --port 8000 > ../backend.log 2>&1 &
echo "后端已启动 (PID: $!)，日志: $DEPLOY_DIR/backend.log"

# ---- 启动前端 ----
echo "[4/4] 启动前端 (端口 8080)..."
cd "$DEPLOY_DIR/frontend"
# 停止旧进程
pkill -f "vite preview" 2>/dev/null || true
# 用 serve 或 vite preview 启动
nohup npx serve dist -l 8080 > ../frontend.log 2>&1 &
echo "前端已启动 (PID: $!)，日志: $DEPLOY_DIR/frontend.log"

echo ""
echo "=== 部署完成 ==="
echo "前端: http://121.41.168.197:8080"
echo "后端: http://121.41.168.197:8000"
echo "API:  http://121.41.168.197:8000/api"
