#!/bin/bash
# ============================================================
# 未来工厂诊断评估系统 - systemd 服务安装脚本
# ============================================================
# 功能：
#   - 安装 systemd 服务，支持崩溃自动重启 + 开机自启
#   - 用法: bash deploy/setup.sh
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== 安装未来工厂诊断评估系统 systemd 服务 ==="

# 检查是否为 root
if [ "$EUID" -ne 0 ]; then
    echo "请使用 root 用户运行此脚本，或执行: sudo bash deploy/setup.sh"
    exit 1
fi

# 复制 service 文件
cp "$SCRIPT_DIR/factory-backend.service" /etc/systemd/system/
cp "$SCRIPT_DIR/factory-frontend.service" /etc/systemd/system/

# 重新加载 systemd
systemctl daemon-reload

# 启用开机自启
systemctl enable factory-backend
systemctl enable factory-frontend

# 启动服务
systemctl restart factory-backend
systemctl restart factory-frontend

echo ""
echo "=== 服务安装完成 ==="
echo ""
echo "查看状态:  systemctl status factory-backend  factory-frontend"
echo "查看日志:  journalctl -u factory-backend -f  /  journalctl -u factory-frontend -f"
echo "重启服务:  systemctl restart factory-backend  factory-frontend"
echo "停止服务:  systemctl stop factory-backend  factory-frontend"
