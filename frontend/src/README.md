# frontend/src

React 前端应用的主目录，包含所有前端源代码。

核心职责：
- 导出应用根组件 (App.tsx)
- 初始化 React 应用 (main.tsx)
- 组织子目录：组件、工具库、Hooks

依赖关系：Wails Go 后端 → React 前端 → UI 组件库

> 一旦本文件夹有所变化，请更新本文档。

## 文件清单

| 文件 | 地位 | 功能 |
|------|------|------|
| `App.tsx` | 核心 | 应用根组件，管理项目选择状态和路由 |
| `main.tsx` | 核心 | React 入口点，挂载应用到 DOM |
| `components/` | 核心 | React 组件目录 |
| `hooks/` | 工具 | React Hooks 工具函数 |
| `lib/` | 工具 | 工具函数和辅助模块 |
