import { Bug } from "lucide-react";
import { useState } from "react";
import {
  GenerateText,
  GenerateImage,
  GenerateVideo,
  GenerateAudio,
} from "../../../wailsjs/go/ai/Service";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

function EnvironmentInfo() {
  const isDev = import.meta.env.DEV;
  const mode = import.meta.env.MODE;

  return (
    <div className="p-4 rounded-lg border bg-muted/30">
      <p className="text-sm font-medium text-muted-foreground mb-2">
        环境信息
      </p>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">模式:</span>
          <span className="font-mono">{mode}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">开发环境:</span>
          <span className="font-mono">{isDev ? "true" : "false"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">User Agent:</span>
          <span className="font-mono text-xs truncate max-w-xs">
            {navigator.userAgent}
          </span>
        </div>
      </div>
    </div>
  );
}

function SystemInfo() {
  return (
    <div className="p-4 rounded-lg border bg-muted/30">
      <p className="text-sm font-medium text-muted-foreground mb-2">
        系统信息
      </p>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">语言:</span>
          <span className="font-mono">{navigator.language}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">硬件并发:</span>
          <span className="font-mono">
            {navigator.hardwareConcurrency || "N/A"}
          </span>
        </div>
      </div>
    </div>
  );
}

function AIBindingTest() {
  const [testPrompt, setTestPrompt] = useState("Hello, AI!");
  const [testResult, setTestResult] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<
    "text" | "image" | "video" | "audio"
  >("text");
  const [selectedModel, setSelectedModel] = useState("gemini");

  const handleTestAI = async () => {
    setTestLoading(true);
    try {
      let response;
      switch (selectedType) {
        case "text":
          response = await GenerateText({
            prompt: testPrompt,
            model: selectedModel,
          });
          break;
        case "image":
          response = await GenerateImage({
            prompt: testPrompt,
            model: selectedModel,
          });
          break;
        case "video":
          response = await GenerateVideo({
            prompt: testPrompt,
            model: selectedModel,
          });
          break;
        case "audio":
          response = await GenerateAudio({
            prompt: testPrompt,
            model: selectedModel,
          });
          break;
      }
      setTestResult(JSON.stringify(response, null, 2));
    } catch (error) {
      setTestResult(`Error: ${error}`);
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="p-4 rounded-lg border bg-muted/30">
      <p className="text-sm font-medium text-muted-foreground mb-4">
        AI Binding 测试
      </p>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="ai-type" className="text-xs text-muted-foreground">
              生成类型
            </Label>
            <Select
              value={selectedType}
              onValueChange={(value) =>
                setSelectedType(value as "text" | "image" | "video" | "audio")
              }
            >
              <SelectTrigger id="ai-type" className="w-full">
                <SelectValue placeholder="选择类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">文本</SelectItem>
                <SelectItem value="image">图像</SelectItem>
                <SelectItem value="video">视频</SelectItem>
                <SelectItem value="audio">音频</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label
              htmlFor="ai-model"
              className="text-xs text-muted-foreground"
            >
              模型
            </Label>
            <Input
              id="ai-model"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              placeholder="输入模型名称，如: gemini"
              className="w-full bg-background"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            测试提示词
          </label>
          <Textarea
            value={testPrompt}
            onChange={(e) => setTestPrompt(e.target.value)}
            placeholder="输入测试提示词..."
            className="min-h-20 bg-background"
          />
        </div>
        <Button
          onClick={handleTestAI}
          disabled={testLoading || !testPrompt.trim()}
          size="sm"
          className="w-full"
        >
          {testLoading ? "测试中..." : "测试 AI 生成"}
        </Button>
        {testResult && (
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              返回结果
            </label>
            <pre className="text-xs bg-background p-3 rounded border overflow-auto max-h-40 whitespace-pre-wrap">
              {testResult}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export function DebugSettings() {

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div>
        <h3 className="text-lg font-medium">调试信息</h3>
        <p className="text-sm text-muted-foreground">
          开发环境专用的调试工具和信息，此页面仅在开发环境中可见。

        </p>
      </div>

      <div className="space-y-4">
        <EnvironmentInfo />
        <SystemInfo />
        <AIBindingTest />
      </div>
    </div>
  );
}
