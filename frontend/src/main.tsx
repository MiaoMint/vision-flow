import { StrictMode } from "react";
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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nProvider i18n={i18n}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <App />
        <Toaster position="top-center" />
      </ThemeProvider>
    </I18nProvider>
  </StrictMode>
);
