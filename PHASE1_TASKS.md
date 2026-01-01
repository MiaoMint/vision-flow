# Firebringer - Phase 1 MVP 任务拆分

**Version**: v1.0
**Date**: 2026-01-02
**Status**: 可执行版本
**总时长**: 4 周

---

## 📋 Phase 1 目标

**核心目标**: 基础工作流编辑器 + 3 个首发 AI 模型（GPT-4o + Nano Banana + Veo 3）

**验收标准**:
- ✅ 可以创建节点、连接节点、执行生成
- ✅ 支持基本的图像和视频生成
- ✅ 所有数据存储在本地
- ✅ BYOK 模式正常工作

---

## Week 1: 基础框架搭建

### 🎯 本周目标

搭建 Go 后端和 React 前端的基础架构，实现本地数据持久化。

---

### 任务 1.1: Go 后端文件结构

**优先级**: P0
**预计时间**: 2 小时
**依赖**: 无

#### 实施内容

**创建目录结构**：
```
models/        # 数据模型
services/      # 业务逻辑
handlers/      # API 处理器
```

**创建文件**：
1. `models/project.go` - 项目数据模型
2. `models/node.go` - 节点数据模型
3. `models/api_config.go` - API 配置模型
4. `models/history.go` - 历史记录模型

**参考代码**：

```go
// models/project.go
package models

import "time"

type Project struct {
    ID          string    `json:"id"`
    Name        string    `json:"name"`
    Description string    `json:"description"`
    CanvasData  string    `json:"canvasData"`
    CreatedAt   time.Time `json:"createdAt"`
    UpdatedAt   time.Time `json:"updatedAt"`
}
```

#### 验收标准

- [ ] 所有模型文件创建完成
- [ ] 每个模型有 JSON 标签
- [ ] 运行 `go build` 无编译错误

#### 下一步

→ 任务 1.2

---

### 任务 1.2: SQLite 数据库初始化

**优先级**: P0
**预计时间**: 3 小时
**依赖**: 任务 1.1

#### 实施内容

**创建文件**：
1. `services/database/sqlite.go` - 数据库初始化
2. `services/database/project_store.go` - 项目存储
3. `services/database/config_store.go` - 配置存储

**参考代码**：

```go
// services/database/sqlite.go
package database

import (
    "database/sql"
    "embed"
    "fmt"
)

//go:embed schema.sql
var schemaFS embed.FS

func InitDB(dbPath string) (*sql.DB, error) {
    db, err := sql.Open("sqlite", dbPath)
    if err != nil {
        return nil, err
    }

    // 执行 schema
    schema, _ := schemaFS.ReadFile("schema.sql")
    _, err = db.Exec(string(schema))
    if err != nil {
        return nil, err
    }

    return db, nil
}
```

```sql
-- services/database/schema.sql
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    canvas_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api_configs (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    model_name TEXT NOT NULL,
    api_key TEXT NOT NULL,
    api_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS history (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    prompt TEXT,
    url TEXT,
    model_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 验收标准

- [ ] 数据库文件自动创建在用户目录
- [ ] 表结构正确创建
- [ ] 可以执行基本的 CRUD 操作

#### 下一步

→ 任务 1.3

---

### 任务 1.3: Go 后端 API 处理器

**优先级**: P0
**预计时间**: 4 小时
**依赖**: 任务 1.2

#### 实施内容

**创建文件**：
1. `handlers/project_handler.go` - 项目管理 API
2. `handlers/config_handler.go` - 配置管理 API
3. `handlers/file_handler.go` - 文件管理 API

**导出方法（供 Wails 绑定）**：

```go
// handlers/project_handler.go
package handlers

import "github.com/firebringer/models"

type ProjectHandler struct {
    db *sql.DB
}

func NewProjectHandler(db *sql.DB) *ProjectHandler {
    return &ProjectHandler{db: db}
}

func (h *ProjectHandler) CreateProject(name string, description string) (*models.Project, error) {
    // 实现项目创建逻辑
}

func (h *ProjectHandler) ListProjects() ([]models.Project, error) {
    // 实现项目列表查询
}

func (h *ProjectHandler) GetProject(id string) (*models.Project, error) {
    // 实现项目详情查询
}

func (h *ProjectHandler) DeleteProject(id string) error {
    // 实现项目删除
}
```

#### 验收标准

- [ ] 所有 handler 方法实现完成
- [ ] 在 `app.go` 中注册 handler
- [ ] Wails 绑定生成 `wailsjs/go/main/App.d.ts`

#### 下一步

→ 任务 1.4

---

### 任务 1.4: React 前端基础组件

**优先级**: P0
**预计时间**: 3 小时
**依赖**: 任务 1.3

#### 实施内容

**创建目录结构**：
```
frontend/src/
├── types/              # TypeScript 类型定义
├── lib/                # 工具函数
├── hooks/              # React Hooks
└── components/
    ├── project/        # 项目相关组件
    ├── settings/       # 设置相关组件
    └── history/        # 历史记录组件
```

**创建文件**：
1. `frontend/src/types/project.ts` - 项目类型定义
2. `frontend/src/types/api.ts` - API 类型定义
3. `frontend/src/lib/api.ts` - API 调用封装
4. `frontend/src/hooks/use-project.ts` - 项目管理 Hook
5. `frontend/src/components/project/ProjectList.tsx` - 项目列表组件
6. `frontend/src/components/project/ProjectCard.tsx` - 项目卡片组件

**参考代码**：

```typescript
// frontend/src/types/project.ts
export interface Project {
  id: string;
  name: string;
  description: string;
  canvasData: string;
  createdAt: string;
  updatedAt: string;
}

// frontend/src/lib/api.ts
import { CreateProject, ListProjects } from '../../wailsjs/go/main/App';

export async function createProject(name: string, description: string) {
  return await CreateProject(name, description);
}

export async function listProjects() {
  return await ListProjects();
}

// frontend/src/hooks/use-project.ts
import { useState, useEffect } from 'react';
import { listProjects } from '../lib/api';
import type { Project } from '../types/project';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listProjects().then(setProjects).finally(() => setLoading(false));
  }, []);

  return { projects, loading };
}
```

#### 验收标准

- [ ] 所有类型定义文件创建完成
- [ ] API 调用封装正确
- [ ] 项目列表组件可以显示项目列表
- [ ] 点击项目可以进入详情

#### 下一步

→ Week 2: 任务 2.1

---

## Week 2: 画布编辑器

### 🎯 本周目标

实现基于 ReactFlow 的无限画布编辑器，支持基础节点创建和连线。

---

### 任务 2.1: ReactFlow 无限画布集成

**优先级**: P0
**预计时间**: 4 小时
**依赖**: Week 1 完成

#### 实施内容

**安装依赖**：
```bash
npm install @xyflow/react
```

**创建文件**：
1. `frontend/src/components/canvas/CanvasView.tsx` - 画布视图组件
2. `frontend/src/components/canvas/NodeTypes.tsx` - 节点类型定义
3. `frontend/src/components/canvas/EdgeTypes.tsx` - 连线类型定义

**参考代码**：

```tsx
// frontend/src/components/canvas/CanvasView.tsx
import React, { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type { Node, Edge } from '@xyflow/react';
import { TextInputNode } from './NodeTypes';

const nodeTypes = {
  'text-input': TextInputNode,
};

export function CanvasView() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      fitView
    >
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  );
}
```

#### 验收标准

- [ ] ReactFlow 画布正常渲染
- [ ] 可以缩放、平移
- [ ] 显示网格背景
- [ ] 显示 MiniMap
- [ ] 显示控制按钮（适应视图、缩放）

#### 下一步

→ 任务 2.2

---

### 任务 2.2: 基础节点类型实现

**优先级**: P0
**预计时间**: 5 小时
**依赖**: 任务 2.1

#### 实施内容

**创建节点组件**：
1. `frontend/src/components/nodes/TextInputNode.tsx` - 文字输入节点
2. `frontend/src/components/nodes/ImageInputNode.tsx` - 图像输入节点
3. `frontend/src/components/nodes/ImageGenNode.tsx` - 图像生成节点
4. `frontend/src/components/nodes/VideoGenNode.tsx` - 视频生成节点

**参考代码**：

```tsx
// frontend/src/components/nodes/TextInputNode.tsx
import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

export function TextInputNode({ data, selected }: NodeProps) {
  return (
    <div className={`p-4 rounded-lg border-2 ${
      selected ? 'border-blue-500' : 'border-gray-300'
    } bg-white shadow-md w-64`}>
      <Handle type="target" position={Position.Top} />

      <div className="font-semibold mb-2">文字输入</div>

      <textarea
        className="w-full p-2 border rounded text-sm"
        placeholder="输入提示词..."
        rows={4}
        value={data.text || ''}
        onChange={(e) => data.onChange?.(e.target.value)}
      />

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
```

#### 验收标准

- [ ] 所有基础节点组件实现完成
- [ ] 节点可以拖拽创建
- [ ] 节点可以选中（高亮显示）
- [ ] 节点输入框可以正常输入
- [ ] 节点之间可以连线

#### 下一步

→ 任务 2.3

---

### 任务 2.3: 节点侧边栏

**优先级**: P1
**预计时间**: 2 小时
**依赖**: 任务 2.2

#### 实施内容

**创建文件**：
1. `frontend/src/components/canvas/NodeSidebar.tsx` - 节点侧边栏组件

**功能**：
- 显示所有可用的节点类型
- 支持拖拽节点到画布
- 分类显示（输入节点、处理节点、输出节点）

**参考代码**：

```tsx
// frontend/src/components/canvas/NodeSidebar.tsx
import React from 'react';
import { useNodesState } from '@xyflow/react';

const nodeTemplates = [
  { type: 'text-input', label: '文字输入' },
  { type: 'image-input', label: '图像输入' },
  { type: 'image-gen', label: '图像生成' },
  { type: 'video-gen', label: '视频生成' },
];

export function NodeSidebar() {
  const [, setNodes] = useNodesState();

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
  };

  return (
    <div className="w-64 p-4 bg-gray-50 border-r">
      <h3 className="font-semibold mb-4">节点库</h3>

      <div className="space-y-2">
        {nodeTemplates.map((node) => (
          <div
            key={node.type}
            className="p-3 bg-white rounded border hover:border-blue-500 cursor-grab"
            draggable
            onDragStart={(e) => onDragStart(e, node.type)}
          >
            {node.label}
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 验收标准

- [ ] 侧边栏显示所有节点类型
- [ ] 可以拖拽节点到画布
- [ ] 拖拽松开后节点正确创建

#### 下一步

→ Week 3: 任务 3.1

---

## Week 3: AI 模型集成

### 🎯 本周目标

实现 BYOK 模式，集成 **3 个首发模型**（GPT-4o + Nano Banana + Veo 3），覆盖对话、图像、视频生成。

**重要说明**：根据 PRD v2.3，Phase 1 首发 3 个模型为：
- **GPT-4o** (OpenAI) - 对话助手
- **Nano Banana** (Google) - 图像生成
- **Google Veo 3** (Google) - 视频生成

---

### 任务 3.1: API Key 配置管理（多模型支持）

**优先级**: P0
**预计时间**: 3 小时
**依赖**: Week 2 完成

#### 实施内容

**创建 Go 后端**：
1. `services/security/keychain.go` - 系统 Keychain 封装
2. `handlers/config_handler.go` - 配置管理 Handler

**创建 React 前端**：
1. `frontend/src/components/settings/ApiKeySettings.tsx` - API Key 设置页面
2. `frontend/src/hooks/use-api-config.ts` - API 配置 Hook

**数据结构**（支持多模型）：

```go
// models/api_config.go
type ApiConfig struct {
    ID        string    `json:"id"`
    Provider  string    `json:"provider"`  // "openai" | "google"
    ModelName string    `json:"modelName"` // "gpt-4o" | "nano-banana" | "veo-3"
    ApiKey    string    `json:"apiKey"`    // 加密存储
    CreatedAt time.Time `json:"createdAt"`
}
```

**功能**：
- 添加多个 API 配置（每个模型一个 Key）
- 按 Provider + ModelName 分组显示
- 删除 API 配置
- API Key 加密存储（使用系统 Keychain）

#### 验收标准

- [ ] 可以添加 OpenAI API Key（GPT-4o）
- [ ] 可以添加 Google API Key（Nano Banana + Veo 3 共用一个 Key）
- [ ] API Key 列表按 Provider 分组显示
- [ ] API Key 可以删除
- [ ] 重启应用后 API Key 仍然存在

#### 下一步

→ 任务 3.2

---

### 任务 3.2: GPT-4o 对话助手集成

**优先级**: P0
**预计时间**: 4 小时
**依赖**: 任务 3.1

#### 实施内容

**创建文件**：
1. `frontend/src/lib/openai.ts` - OpenAI API 调用封装
2. `frontend/src/components/nodes/ChatAgentNode.tsx` - 对话助手节点

**功能**：
- 从本地存储获取 OpenAI API Key
- 调用 GPT-4o Chat Completion API
- 显示对话历史
- 处理流式响应

**参考代码**：

```typescript
// frontend/src/lib/openai.ts
export async function chatWithGPT4o(
  messages: { role: string; content: string }[],
  apiKey: string
) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
```

#### 验收标准

- [ ] 可以成功调用 GPT-4o API
- [ ] 对话节点显示对话历史
- [ ] API Key 失效时显示错误提示
- [ ] 支持多轮对话
- [ ] 历史记录中记录此次对话

#### 下一步

→ 任务 3.3

---

### 任务 3.3: Nano Banana 图像生成集成

**优先级**: P0
**预计时间**: 4 小时
**依赖**: 任务 3.2

#### 实施内容

**创建文件**：
1. `frontend/src/lib/google.ts` - Google API 调用封装
2. `frontend/src/components/nodes/ImageGenNode.tsx` - 图像生成节点（完善版）

**功能**：
- 从本地存储获取 Google API Key
- 调用 Nano Banana 图像生成 API
- 显示生成进度（异步任务）
- 支持下载生成的图像

**参考代码**：

```typescript
// frontend/src/lib/google.ts
export async function generateImageWithNanoBanana(
  prompt: string,
  apiKey: string,
  options?: {
    size?: string;
    aspectRatio?: string;
  }
) {
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/nano-banana:predict', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      size: options?.size || '1024x1024',
      aspectRatio: options?.aspectRatio || '1:1',
    }),
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.imageBaseUrl; // 假设的响应格式
}
```

#### 验收标准

- [ ] 可以成功调用 Nano Banana API
- [ ] 图像生成节点显示进度条
- [ ] 生成成功后显示图像
- [ ] 支持下载图像到本地
- [ ] 历史记录中记录此次生成

#### 下一步

→ 任务 3.4

---

### 任务 3.4: Google Veo 3 视频生成集成

**优先级**: P0
**预计时间**: 5 小时
**依赖**: 任务 3.3

#### 实施内容

**创建文件**：
1. `frontend/src/lib/veo.ts` - Veo 3 API 调用封装
2. `frontend/src/components/nodes/VideoGenNode.tsx` - 视频生成节点（完善版）
3. `frontend/src/components/nodes/OutputVideoNode.tsx` - 视频输出节点

**功能**：
- 调用 Google Veo 3 视频生成 API
- 异步任务队列（轮询任务状态）
- 进度条更新（1Hz 频率）
- 支持首尾帧模式
- 生成完成后桌面通知

**参考代码**：

```typescript
// frontend/src/lib/veo.ts
export async function generateVideoWithVeo3(
  prompt: string,
  apiKey: string,
  options?: {
    duration?: string;    // "5s"
    resolution?: string; // "1920x1080"
  }
) {
  // 1. 提交生成任务
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/veo-3:generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      duration: options?.duration || '5s',
      resolution: options?.resolution || '1920x1080',
    }),
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    taskId: data.taskId,
    status: 'processing',
  };
}

// 2. 轮询任务状态
export async function pollVideoStatus(
  taskId: string,
  apiKey: string
): Promise<{ status: string; videoUrl?: string }> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/tasks/${taskId}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  const data = await response.json();
  return {
    status: data.status, // "processing" | "completed" | "failed"
    videoUrl: data.videoUrl,
  };
}
```

**进度更新逻辑**：

```typescript
// frontend/src/components/nodes/VideoGenNode.tsx
import { useState, useEffect } from 'react';

export function VideoGenNode({ data }: NodeProps) {
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);

  const handleGenerate = async () => {
    // 1. 提交任务
    const result = await generateVideoWithVeo3(prompt, apiKey);
    setStatus('processing');

    // 2. 轮询状态
    const pollInterval = setInterval(async () => {
      const statusResult = await pollVideoStatus(result.taskId, apiKey);

      if (statusResult.status === 'completed') {
        clearInterval(pollInterval);
        setStatus('completed');
        setProgress(100);
        // 保存到历史记录
        await addHistory({
          type: 'video',
          status: 'completed',
          url: statusResult.videoUrl,
          modelName: 'veo-3',
        });
      } else if (statusResult.status === 'failed') {
        clearInterval(pollInterval);
        setStatus('failed');
      }
    }, 1000); // 每 1 秒轮询一次
  };
}
```

#### 验收标准

- [ ] 可以成功提交视频生成任务
- [ ] 显示进度条，实时更新（1Hz 频率）
- [ ] 生成完成后显示视频播放器
- [ ] 支持下载视频到本地
- [ ] 生成完成后显示桌面通知
- [ ] 历史记录中记录此次生成

#### 下一步

→ Week 4: 任务 4.1

---

## Week 4: 项目管理与导出

### 🎯 本周目标

完善本地项目管理功能，实现工作流导出。

---

### 任务 4.1: 保存画布状态

**优先级**: P0
**预计时间**: 3 小时
**依赖**: Week 3 完成

#### 实施内容

**实现功能**：
- 自动保存画布状态到 SQLite
- 手动保存按钮
- 加载项目时恢复画布状态

**修改文件**：
1. `handlers/project_handler.go` - 添加 `SaveProjectCanvas` 方法
2. `frontend/src/components/canvas/CanvasView.tsx` - 添加自动保存逻辑

**参考代码**：

```go
// handlers/project_handler.go
func (h *ProjectHandler) SaveProjectCanvas(projectId string, canvasData string) error {
    query := `
        UPDATE projects
        SET canvas_data = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `
    _, err := h.db.Exec(query, canvasData, projectId)
    return err
}
```

```typescript
// frontend/src/components/canvas/CanvasView.tsx
import { useEffect } from 'react';
import { useNodesState, useEdgesState } from '@xyflow/react';
import { SaveProjectCanvas } from '../../../wailsjs/go/main/App';

export function CanvasView({ projectId }: { projectId: string }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // 自动保存
  useEffect(() => {
    const timer = setTimeout(() => {
      const canvasData = JSON.stringify({ nodes, edges });
      SaveProjectCanvas(projectId, canvasData);
    }, 2000); // 2秒防抖

    return () => clearTimeout(timer);
  }, [nodes, edges, projectId]);

  // ...
}
```

#### 验收标准

- [ ] 画布状态自动保存到 SQLite
- [ ] 刷新页面后画布状态恢复
- [ ] 保存频率合理（2秒防抖）

#### 下一步

→ 任务 4.2

---

### 任务 4.2: 历史记录系统

**优先级**: P1
**预计时间**: 3 小时
**依赖**: 任务 4.1

#### 实施内容

**创建文件**：
1. `frontend/src/components/history/HistoryPanel.tsx` - 历史记录面板
2. `handlers/history_handler.go` - 历史记录 Handler

**功能**：
- 记录每次 AI 生成操作
- 显示历史记录列表（带缩略图）
- 支持从历史记录恢复到画布
- 支持删除历史记录

**参考代码**：

```go
// handlers/history_handler.go
func (h *HistoryHandler) AddHistory(item models.HistoryItem) error {
    query := `
        INSERT INTO history (id, type, status, prompt, url, model_name)
        VALUES (?, ?, ?, ?, ?, ?)
    `
    _, err := h.db.Exec(query, item.ID, item.Type, item.Status, item.Prompt, item.Url, item.ModelName)
    return err
}

func (h *HistoryHandler) ListHistory(limit int, offset int) ([]models.HistoryItem, error) {
    query := `
        SELECT id, type, status, prompt, url, model_name, created_at
        FROM history
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    `
    rows, err := h.db.Query(query, limit, offset)
    // ... 扫描结果
}
```

#### 验收标准

- [ ] AI 生成操作自动记录到历史
- [ ] 历史记录列表正确显示
- [ ] 点击历史记录可以查看详情
- [ ] 可以删除历史记录

#### 下一步

→ 任务 4.3

---

### 任务 4.3: 导出功能

**优先级**: P1
**预计时间**: 2 小时
**依赖**: Week 4 完成

#### 实施内容

**实现功能**：
- 导出工作流为 JSON 文件
- 导出生成的图像/视频

**创建文件**：
1. `handlers/file_handler.go` - 添加 `ExportProject` 方法
2. `frontend/src/components/project/ExportButton.tsx` - 导出按钮

**参考代码**：

```go
// handlers/file_handler.go
func (h *FileHandler) ExportProject(projectId string, outputPath string) error {
    // 1. 获取项目数据
    project, err := h.projectHandler.GetProject(projectId)
    if err != nil {
        return err
    }

    // 2. 构建 JSON
    exportData := map[string]interface{}{
        "version": "1.0",
        "project": project,
        "nodes":    parseNodes(project.CanvasData),
        "edges":    parseEdges(project.CanvasData),
    }

    // 3. 写入文件
    jsonData, _ := json.MarshalIndent(exportData, "", "  ")
    return ioutil.WriteFile(outputPath, jsonData, 0644)
}
```

#### 验收标准

- [ ] 可以导出工作流 JSON 文件
- [ ] JSON 文件格式正确（包含项目、节点、连线数据）
- [ ] 导出的 JSON 文件可被其他工具读取
- [ ] 导出的图像/视频文件可以正常打开

> **注**：工作流导入功能规划于 Phase 2，Phase 1 仅实现导出。

---

## 🎉 Phase 1 完成验收

### 最终验收清单

**Week 1**:
- [x] Go 后端文件结构完整
- [x] SQLite 数据库正常工作
- [x] React 前端基础组件完成

**Week 2**:
- [x] ReactFlow 无限画布集成
- [x] 基础节点类型实现
- [x] 节点侧边栏功能

**Week 3**:
- [x] API Key 配置管理完成
- [x] BYOK 调用逻辑实现
- [x] 首个图像生成模型集成

**Week 4**:
- [x] 画布状态保存/加载
- [x] 历史记录系统
- [x] 导出功能

### 功能演示流程

1. **创建项目**
   - 打开应用 → 点击"新建项目"
   - 输入项目名称 → 创建成功

2. **配置 API Key**
   - 进入设置页面
   - 添加 OpenAI API Key
   - 保存成功

3. **创建工作流**
   - 从侧边栏拖拽"文字输入"节点到画布
   - 拖拽"图像生成"节点到画布
   - 连接两个节点

4. **执行生成**
   - 在文字输入节点输入提示词
   - 点击图像生成节点的"生成"按钮
   - 等待生成完成
   - 查看生成的图像

5. **查看历史**
   - 打开历史记录面板
   - 查看刚才的生成记录
   - 点击记录可以查看详情

6. **导出工作流**
   - 点击"导出"按钮
   - 选择保存位置
   - 导出 JSON 文件成功

---

## 🚀 开始开发

### 推荐开发顺序

1. **从 Week 1 开始**，按任务顺序执行
2. **每个任务完成后**，本地测试验证
3. **遇到问题**，及时反馈给 Claude Code

### Claude Code 使用方式

每个任务开发时，直接对 Claude Code 说：

```
"帮我实现 PHASE1_TASKS.md 中的任务 1.1"
"帮我实现 PHASE1_TASKS.md 中的任务 2.2"
"帮我修复图像生成节点的 bug"
```

### 注意事项

1. **遵循 CLAUDE.md 规范**：每个文件添加 Input/Output/Pos 注释
2. **及时提交代码**：每个任务完成后 git commit
3. **保持文档同步**：修改架构后更新 ARCHITECTURE.md

---

**文档维护**: 随开发进度持续更新
**问题反馈**: 请在项目 Issue 中提出
