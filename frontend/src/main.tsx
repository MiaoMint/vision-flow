// Input: React library, index.css for global styles, App.tsx (root component - manages project selection state, layout container)
// Output: React application rendered to DOM
// Position: React entry point - initializes and renders the app
//
// ⚠️ WHEN THIS FILE IS UPDATED:
// 1. Update this header comment
// 2. Update the parent folder's AI_ARCHITECTURE.md

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
