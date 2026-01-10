import { Sparkles } from "lucide-react";

export function AboutSettings() {
  return (
    <div className="p-8 max-w-2xl h-full flex flex-col">
      <div className="flex-1 space-y-8">
        <div className="flex flex-col items-center justify-center py-10 space-y-4">
          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center">
            <img src="/appicon.png" alt="logo" />
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold">Firebringer</h3>
            <p className="text-sm text-muted-foreground">Version 0.0.1</p>
          </div>
          <p className="text-sm leading-relaxed text-center">
            Firebringer 是一个可视化工作流编排工具，通过直观的节点式界面，
            让你轻松设计和管理 AI 驱动的智能工作流。
          </p>
        </div>
      </div>

      <div className="text-center text-xs text-muted-foreground pt-8">
        © 2026 Firebringer. All rights reserved.
      </div>
    </div>
  );
}
