# Firebringer - Go 后端

Wails 桌面应用的 Go 后端层，负责应用启动和前端桥接。

核心职责：
- 初始化 Wails 桌面应用实例
- 提供 Go 方法供前端调用（通过 Wails Bindings）
- 嵌入前端资源（React 构建）

依赖关系：Wails 框架 → Go 后端 → 前端 React

> 一旦本文件夹有所变化，请更新本文档。

## 文件清单

| 文件 | 地位 | 功能 |
|------|------|------|
| `main.go` | 核心 | Wails 应用入口，配置桌面窗口参数 |
| `app.go` | 核心 | 应用结构体，暴露给前端的方法（Greet 等） |
| `frontend/` | - | React 前端源码（独立目录） |
| `wails.json` | 配置 | Wails 项目配置文件 |
