import { useState } from "react";
import { Trans } from "@lingui/react/macro";
import {
  GenerateText,
  GenerateImage,
  GenerateVideo,
  GenerateAudio,
} from "../../../wailsjs/go/ai/Service";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ModelSelector } from "@/components/ai/model-selector";
import { useLingui } from "@lingui/react";
import { msg } from "@lingui/core/macro";

// ... (EnvironmentInfo and SystemInfo functions restored below)
function EnvironmentInfo() {
  const isDev = import.meta.env.DEV;
  const mode = import.meta.env.MODE;

  return (
    <div className="p-4 rounded-lg border bg-muted/30">
      <p className="text-sm font-medium text-muted-foreground mb-2">
        <Trans>Environment Info</Trans>
      </p>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground"><Trans>Mode:</Trans></span>
          <span className="font-mono">{mode}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground"><Trans>Development Environment:</Trans></span>
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
        <Trans>System Info</Trans>
      </p>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground"><Trans>Language:</Trans></span>
          <span className="font-mono">{navigator.language}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground"><Trans>Hardware Concurrency:</Trans></span>
          <span className="font-mono">
            {navigator.hardwareConcurrency || "N/A"}
          </span>
        </div>
      </div>
    </div>
  );
}

function AIBindingTest() {
  const { _ } = useLingui();
  const [testPrompt, setTestPrompt] = useState("Hello, AI!");
  const [testResult, setTestResult] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<
    "text" | "image" | "video" | "audio"
  >("text");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedProviderId, setSelectedProviderId] = useState<number>(0);

  const handleTestAI = async () => {
    if (!selectedProviderId) {
      setTestResult("Error: Please select a provider");
      return;
    }
    setTestLoading(true);
    try {
      let response;
      switch (selectedType) {
        case "text":
          response = await GenerateText({
            prompt: testPrompt,
            model: selectedModel,
            providerId: selectedProviderId,
          });
          break;
        case "image":
          response = await GenerateImage({
            prompt: testPrompt,
            model: selectedModel,
            providerId: selectedProviderId,
          });
          break;
        case "video":
          response = await GenerateVideo({
            prompt: testPrompt,
            model: selectedModel,
            providerId: selectedProviderId,
          });
          break;
        case "audio":
          response = await GenerateAudio({
            prompt: testPrompt,
            model: selectedModel,
            providerId: selectedProviderId,
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

  const handleProviderChange = (id: number) => {
    setSelectedProviderId(id);
    setSelectedModel(""); // Reset model when provider changes
  }

  return (
    <div className="p-4 rounded-lg border bg-muted/30">
      <p className="text-sm font-medium text-muted-foreground mb-4">
        <Trans>AI Binding Test</Trans>
      </p>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label className="text-xs text-muted-foreground block mb-2">
              <Trans>Model Selection (Provider / Model)</Trans>
            </Label>
            <ModelSelector
              providerId={selectedProviderId || undefined}
              modelId={selectedModel}
              onProviderChange={handleProviderChange}
              onModelChange={setSelectedModel}
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="ai-type" className="text-xs text-muted-foreground block mb-2">
              <Trans>Generation Type</Trans>
            </Label>
            <Select
              value={selectedType}
              onValueChange={(value) =>
                setSelectedType(value as "text" | "image" | "video" | "audio")
              }
            >
              <SelectTrigger id="ai-type" className="w-full">
                <SelectValue placeholder={<Trans>Select type</Trans>} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text"><Trans>Text</Trans></SelectItem>
                <SelectItem value="image"><Trans>Image</Trans></SelectItem>
                <SelectItem value="video"><Trans>Video</Trans></SelectItem>
                <SelectItem value="audio"><Trans>Audio</Trans></SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            <Trans>Test Prompt</Trans>
          </label>
          <Textarea
            value={testPrompt}
            onChange={(e) => setTestPrompt(e.target.value)}
            placeholder={_(msg`Enter test prompt...`)}
            className="min-h-20 bg-background"
          />
        </div>
        <Button
          onClick={handleTestAI}
          disabled={testLoading || !testPrompt.trim()}
          size="sm"
          className="w-full"
        >
          {testLoading ? <Trans>Testing...</Trans> : <Trans>Test AI Generation</Trans>}
        </Button>
        {testResult && (
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              <Trans>Result</Trans>
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
        <h3 className="text-lg font-medium"><Trans>Debug Information</Trans></h3>
        <p className="text-sm text-muted-foreground">
          <Trans>Debugging tools and information for development environments only. This page is only visible in development environments.</Trans>
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
