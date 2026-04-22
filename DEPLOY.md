# 未来工厂诊断评估系统 - 部署指南

## 架构说明

- **前端**：React + Vite，端口 **8080**
- **后端**：FastAPI + SQLite，端口 **8000**
- 前端 API 通过环境变量 `VITE_API_BASE_URL` 指向后端地址

---

## 一、前置准备

### 1. 安全组开放端口

在阿里云控制台 -> 安全组，放行以下端口：

| 端口 | 用途 |
|------|------|
| 8000 | 后端 API |
| 8080 | 前端页面 |

### 2. 服务器环境要求

- Python 3.8+
- Node.js 18+ (仅用于构建前端)
- Git

---

## 二、首次部署

### 1. 拉取代码

```bash
ssh root@121.41.168.197
cd ~
git clone https://github.com/sakurakobe/future-factory-system.git
cd future-factory-system
```

### 2. 安装后端依赖

```bash
cd ~/future-factory-system/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. 构建前端

```bash
cd ~/future-factory-system/frontend
npm install
npm run build
```

> 构建产物在 `frontend/dist/` 目录，前端访问地址为 `http://121.41.168.197:8080`

### 4. 导入题库数据（已内置，无需操作）

题库 XLSX 文件已内置在 `backend/` 目录下，后端启动时会自动检测空库并导入。

> 如需手动重新导入：
> ```bash
> cd ~/future-factory-system/backend
> source venv/bin/activate
> python seed/init_db.py
> ```

### 5. 启动服务

```bash
# 启动后端 (端口 8000)
cd ~/future-factory-system/backend
source venv/bin/activate
nohup uvicorn main:app --host 0.0.0.0 --port 8000 > ../backend.log 2>&1 &

# 启动前端 (端口 8080)
cd ~/future-factory-system/frontend
npx serve dist -l 8080 > ../frontend.log 2>&1 &

# 查看日志确认启动成功
tail -f ~/future-factory-system/backend.log ~/future-factory-system/frontend.log
```

### 6. 验证部署

```bash
# 后端健康检查
curl http://121.41.168.197:8000/api/health
# 预期返回: {"status": "ok"}

# 前端页面
curl http://121.41.168.197:8080
# 预期返回 HTML 内容
```

### 7. 访问系统

- 前端：http://121.41.168.197:8080
- 后端 API 文档：http://121.41.168.197:8000/docs

---

## 三、更新部署

```bash
cd ~/future-factory-system
git pull

# 重新构建前端
cd frontend && npm install && npm run build

# 重启后端
cd ../backend
source venv/bin/activate
pip install -r requirements.txt
pkill -f "uvicorn main:app"
nohup uvicorn main:app --host 0.0.0.0 --port 8000 > ../backend.log 2>&1 &

# 重启前端
cd ../frontend
pkill -f "serve dist"
npx serve dist -l 8080 > ../frontend.log 2>&1 &
```

---

## 四、生产环境管理（推荐）

### 使用 Supervisor 管理进程

```bash
# 安装 supervisor
sudo apt install supervisor -y   # Ubuntu/Debian
# 或
sudo yum install supervisor -y   # CentOS

# 创建后端配置
sudo cat > /etc/supervisor/conf.d/factory-backend.conf << 'EOF'
[program:factory-backend]
command=/root/future-factory-system/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
directory=/root/future-factory-system/backend
user=root
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/factory-backend.log
environment=PYTHONUNBUFFERED="1"
EOF

# 创建前端配置
sudo cat > /etc/supervisor/conf.d/factory-frontend.conf << 'EOF'
[program:factory-frontend]
command=npx serve dist -l 8080
directory=/root/future-factory-system/frontend
user=root
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/factory-frontend.log
EOF

# 重新加载并启动
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start factory-backend factory-frontend
```

### 查看状态

```bash
sudo supervisorctl status
```

---

## 五、数据库维护

### 备份数据库

```bash
cp ~/future-factory-system/backend/future_factory.db ~/future-factory-system/backend/future_factory.db.bak
```

### 重置题库

```bash
cd ~/future-factory-system/backend
source venv/bin/activate
XLSX_PATH=./未来工厂标准诊断评估题库.xlsx python seed/init_db.py
```

---

## 六、版本信息

当前版本：**v1.0.1**

- 前端：React 18 + Vite 5 + TypeScript
- 后端：FastAPI + SQLAlchemy + SQLite
- 部署端口：前端 8080，后端 8000
