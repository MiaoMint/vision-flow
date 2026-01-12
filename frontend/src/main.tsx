import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import App from "./App.tsx";
import { Toaster } from "./components/ui/sonner.tsx";
import { ThemeProvider } from "./components/theme-provider.tsx";
import { I18nProvider } from "@lingui/react";
import { i18n } from "@lingui/core";
import { defaultLocale, dynamicActivate } from "./i18n";

// Initialize i18n
dynamicActivate(defaultLocale);

// 移除加载动画并显示主界面
const removeLoader = () => {
  const loader = document.getElementById('app-loading');
  const root = document.getElementById('root');
  
  if (loader && root) {
    // 先让内容淡入
    requestAnimationFrame(() => {
      root.classList.add('loaded');
      document.body.classList.add('loaded');
      // 同时让加载屏淡出
      loader.classList.add('fade-out');
      // 动画完成后移除加载屏
      setTimeout(() => {
        loader.remove();
      }, 600);
    });
  }
};

function AppWrapper() {
  useEffect(() => {
    // 组件挂载后移除加载动画
    removeLoader();
  }, []);

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <App />
      <Toaster position="top-center" />
    </ThemeProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nProvider i18n={i18n}>
      <AppWrapper />
    </I18nProvider>
  </StrictMode>
);
