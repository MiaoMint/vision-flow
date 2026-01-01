/**
 * Input: App 组件 (从 App.tsx 导入)
 * Output: 渲染 React 应用到 DOM
 * Pos: 前端应用的入口点，初始化 React 根渲染器
 *
 * 一旦本文件被更新，务必更新：
 * 1. 本注释块
 * 2. frontend/src/README.md
 */
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
