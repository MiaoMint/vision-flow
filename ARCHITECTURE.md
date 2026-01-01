# Firebringer - 技术架构文档

**Version**: v1.0
**Date**: 2026-01-02
**Status**: Phase 1 MVP 实施指南

---

## 1. 系统架构概览

### 1.1 技术栈

```
┌─────────────────────────────────────────────────────────────┐
│                    Firebringer 架构栈                         │
├─────────────────────────────────────────────────────────────┤
│  前端层 (React 19 + TypeScript)                              │
│  - ReactFlow (无限画布)                                       │
│  - shadcn/ui (UI 组件库)                                      │
│  - Tailwind CSS (样式)                                       │
│  - Zustand (状态管理，Phase 2)                                │
├─────────────────────────────────────────────────────────────┤
│  通信层 (Wails IPC Bindings)                                 │
│  - Go 方法 → JavaScript 函数                                 │
│  - 类型安全 (自动生成 .d.ts)                                 │
├─────────────────────────────────────────────────────────────┤
│  后端层 (Go 1.21+)                                            │
│  - SQLite (数据库)                                           │
│  - 系统 Keychain (API Key 加密存储)                          │
│  - 本地文件系统 (缓存管理)                                   │
├─────────────────────────────────────────────────────────────┤
│  外部服务 (HTTPS API 调用) - Phase 1 首发模型                  │
│  - OpenAI API (GPT-4o - 对话助手)                            │
│  - Google API (Nano Banana - 图像生成)                       │
│  - Google API (Veo 3 - 视频生成)                             │
│  > 其他模型（Runway, Kling, Claude 等）为 Phase 2/3 规划       │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 目录结构规划

### 2.1 完整目录结构

```
firebringer/
├── main.go                          # Wails 应用入口
├── app.go                           # 应用主结构体
├── wails.json                       # Wails 配置
│
├── models/                          # [Go] 数据模型定义
│   ├── project.go                   # 项目模型
│   ├── node.go                      # 节点模型
│   ├── connection.go                # 连线模型
│   ├── history.go                   # 历史记录模型
│   └── api_config.go                # API 配置模型
│
├── services/                        # [Go] 业务逻辑层
│   ├── database/                    # 数据库服务
│   │   ├── sqlite.go                # SQLite 初始化
│   │   ├── project_store.go         # 项目存储
│   │   ├── config_store.go          # 配置存储
│   │   └── history_store.go         # 历史记录存储
│   ├── file/                        # 文件管理服务
│   │   ├── cache.go                 # 缓存管理
│   │   └── export.go                # 导出功能
│   └── security/                    # 安全服务
│       ├── keychain.go              # 系统 Keychain 封装
│       └── encryption.go            # 加密/解密工具
│
├── handlers/                        # [Go] API 处理器（暴露给前端）
│   ├── project_handler.go           # 项目相关操作
│   ├── config_handler.go            # 配置相关操作
│   ├── file_handler.go              # 文件相关操作
│   └── history_handler.go           # 历史记录操作
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx                  # 应用根组件
│   │   ├── main.tsx                 # React 入口
│   │   │
│   │   ├── components/              # React 组件
│   │   │   ├── canvas/              # [Phase 1] 画布相关
│   │   │   │   ├── CanvasView.tsx   # 画布视图
│   │   │   │   ├── NodeTypes.tsx    # 节点类型定义
│   │   │   │   └── EdgeTypes.tsx    # 连线类型定义
│   │   │   │
│   │   │   ├── nodes/               # [Phase 1] 节点组件
│   │   │   │   ├── TextInputNode.tsx
│   │   │   │   ├── ImageInputNode.tsx
│   │   │   │   ├── ImageGenNode.tsx
│   │   │   │   └── VideoGenNode.tsx
│   │   │   │
│   │   │   ├── settings/            # [Phase 1] 设置页面
│   │   │   │   └── ApiKeySettings.tsx
│   │   │   │
│   │   │   ├── project/             # [Phase 1] 项目管理
│   │   │   │   ├── ProjectList.tsx
│   │   │   │   └── ProjectCard.tsx
│   │   │   │
│   │   │   ├── history/             # [Phase 1] 历史记录
│   │   │   │   └── HistoryPanel.tsx
│   │   │   │
│   │   │   └── ui/                  # shadcn/ui 基础组件
│   │   │       └── (已有组件...)
│   │   │
│   │   ├── lib/                     # 工具函数
│   │   │   ├── api.ts               # [Phase 1] API 调用封装
│   │   │   ├── store.ts             # [Phase 2] 状态管理
│   │   │   └── utils.ts             # 通用工具
│   │   │
│   │   ├── hooks/                   # React Hooks
│   │   │   ├── use-canvas.ts        # [Phase 1] 画布 Hook
│   │   │   ├── use-project.ts       # [Phase 1] 项目 Hook
│   │   │   └── use-api-config.ts    # [Phase 1] API 配置 Hook
│   │   │
│   │   └── types/                   # TypeScript 类型定义
│   │       ├── project.ts           # 项目类型
│   │       ├── node.ts              # 节点类型
│   │       ├── api.ts               # API 类型
│   │       └── index.ts             # 统一导出
│   │
│   └── wailsjs/                     # Wails 自动生成（不手动编辑）
│       ├── go/
│       │   └── main/
│       │       ├── App.d.ts         # Go 方法的类型定义
│       │       └── App.js           # Go 方法的 JS 绑定
│       └── runtime/
│           ├── runtime.d.ts
│           └── runtime.js
│
├── build/                           # 构建输出
├── .claude/                         # Claude Code 配置
│   └── CLAUDE.md                    # 开发规范
│
├── PRD.md                           # 产品需求文档
├── ARCHITECTURE.md                  # 本文档
├── PHASE1_TASKS.md                  # Phase 1 任务拆分
└── BACKEND.md                       # 后端概览
```

---

## 3. API 接口定义（Go → React）

### 3.1 项目管理 API

```go
// handlers/project_handler.go

type ProjectHandler struct {
    db *services.DatabaseService
}

// CreateProject 创建新项目
func (h *ProjectHandler) CreateProject(name string, description string) (*models.Project, error)

// GetProject 获取项目详情
func (h *ProjectHandler) GetProject(id string) (*models.Project, error)

// ListProjects 获取所有项目
func (h *ProjectHandler) ListProjects() ([]models.Project, error)

// UpdateProject 更新项目
func (h *ProjectHandler) UpdateProject(id string, name string, description string) error

// DeleteProject 删除项目
func (h *ProjectHandler) DeleteProject(id string) error

// SaveProjectCanvas 保存画布状态
func (h *ProjectHandler) SaveProjectCanvas(projectId string, canvasData string) error

// LoadProjectCanvas 加载画布状态
func (h *ProjectHandler) LoadProjectCanvas(projectId string) (string, error)
```

### 3.2 配置管理 API

```go
// handlers/config_handler.go

type ConfigHandler struct {
    keychain *services.KeychainService
}

// SaveApiConfig 保存 API 配置（加密存储）
func (h *ConfigHandler) SaveApiConfig(provider string, modelName string, apiKey string, apiUrl string) error

// ListApiConfigs 列出所有 API 配置
func (h *ConfigHandler) ListApiConfigs() ([]models.ApiConfig, error)

// DeleteApiConfig 删除 API 配置
func (h *ConfigHandler) DeleteApiConfig(id string) error

// GetApiConfig 获取单个 API 配置（解密）
func (h *ConfigHandler) GetApiConfig(id string) (*models.ApiConfig, error)
```

### 3.3 文件管理 API

```go
// handlers/file_handler.go

type FileHandler struct {
    cacheService *services.CacheService
}

// SaveFile 保存文件到本地缓存
func (h *FileHandler) SaveFile(data string, filename string, fileType string) (*models.FileSaveResult, error)

// GetCacheInfo 获取缓存信息
func (h *FileHandler) GetCacheInfo() (*models.CacheInfo, error)

// ClearCache 清空缓存
func (h *FileHandler) ClearCache(fileType string) error

// ExportProject 导出项目为 JSON
func (h *FileHandler) ExportProject(projectId string, outputPath string) error
```

### 3.4 历史记录 API

```go
// handlers/history_handler.go

type HistoryHandler struct {
    db *services.DatabaseService
}

// AddHistory 添加历史记录
func (h *HistoryHandler) AddHistory(item models.HistoryItem) error

// ListHistory 获取历史记录
func (h *HistoryHandler) ListHistory(limit int, offset int) ([]models.HistoryItem, error)

// DeleteHistory 删除历史记录
func (h *HistoryHandler) DeleteHistory(id string) error
```

---

## 4. 数据模型定义

### 4.1 Go 数据模型

```go
// models/project.go
type Project struct {
    ID          string    `json:"id"`
    Name        string    `json:"name"`
    Description string    `json:"description"`
    CanvasData  string    `json:"canvasData"`  // JSON 字符串
    CreatedAt   time.Time `json:"createdAt"`
    UpdatedAt   time.Time `json:"updatedAt"`
}

// models/node.go
type Node struct {
    ID       string                 `json:"id"`
    Type     string                 `json:"type"`
    Position map[string]interface{} `json:"position"`
    Data     map[string]interface{} `json:"data"`
}

// models/api_config.go
type ApiConfig struct {
    ID       string `json:"id"`
    Provider string `json:"provider"`  // "openai", "google", "runway"
    ModelName string `json:"modelName"`
    ApiKey   string `json:"apiKey"`    // 加密存储
    ApiUrl   string `json:"apiUrl"`
    CreatedAt time.Time `json:"createdAt"`
}

// models/history.go
type HistoryItem struct {
    ID         string    `json:"id"`
    Type       string    `json:"type"`  // "image" | "video"
    Status     string    `json:"status"`  // "pending" | "processing" | "completed" | "failed"
    Prompt     string    `json:"prompt"`
    Url        string    `json:"url"`
    ModelName  string    `json:"modelName"`
    CreatedAt  time.Time `json:"createdAt"`
}
```

### 4.2 TypeScript 类型定义（对应 Go 模型）

```typescript
// frontend/src/types/project.ts
export interface Project {
  id: string;
  name: string;
  description: string;
  canvasData: string;  // JSON string, needs parsing
  createdAt: string;
  updatedAt: string;
}

// frontend/src/types/node.ts
export interface Node {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, any>;
}

export type NodeType =
  | 'text-input'
  | 'image-input'
  | 'video-input'
  | 'image-gen'
  | 'video-gen'
  | 'output-image'
  | 'output-video';

// frontend/src/types/api.ts
export interface ApiConfig {
  id: string;
  provider: 'openai' | 'google' | 'runway' | 'kling';
  modelName: string;
  apiKey: string;  // Encrypted
  apiUrl: string;
  createdAt: string;
}

// frontend/src/types/history.ts
export interface HistoryItem {
  id: string;
  type: 'image' | 'video';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  prompt: string;
  url?: string;
  modelName: string;
  createdAt: string;
}
```

---

## 5. 数据流图

### 5.1 项目创建流程

```
用户操作              React 组件              Wails Bindings          Go 后端              SQLite
   │                      │                       │                      │                    │
   ├─ 点击"新建项目" ────>│                       │                      │                    │
   │                      │                       │                      │                    │
   │                      ├─ 调用 CreateProject ─>│                      │                    │
   │                      │   (wailsjs/go/main)   │                      │                    │
   │                      │                       │                      │                    │
   │                      │                       ├─ IPC 通信 ──────────>│                    │
   │                      │                       │                      │                    │
   │                      │                       │                      ├─ INSERT project ──>│
   │                      │                       │                      │                    │
   │                      │                       │                      ├─ 返回 Project ─────┤
   │                      │                       │                      │                    │
   │                      │<─ 返回 Project ───────┤<─────────────────────┤                    │
   │                      │                       │                      │                    │
   │<─ 更新 UI ────────────┤                       │                      │                    │
```

### 5.2 AI 图像生成流程（BYOK）

```
用户操作              React 组件              第三方 API              Go 后端              本地缓存
   │                      │                       │                      │                    │
   ├─ 配置 API Key ──────>│                       │                      │                    │
   │                      │                       │                      │                    │
   │                      ├─ SaveApiConfig ──────>│                      │                    │
   │                      │                       │                      ├─ 加密存储 ────────>│ Keychain
   │                      │                       │                      │                    │
   │<─ 配置成功 ───────────┤                       │                      │                    │
   │                      │                       │                      │                    │
   ├─ 执行图像生成 ───────>│                       │                      │                    │
   │                      │                       │                      │                    │
   │                      ├─ 获取 API Key ────────>│                      │                    │
   │                      │                       │                      ├─ 解密 ────────────>│ Keychain
   │                      │                       │                      │                    │
   │                      │<─ 返回明文 Key ────────┤                      │                    │
   │                      │                       │                      │                    │
   │                      ├─ fetch(OpenAI API) ───>│                      │                    │
   │                      │   (携带 API Key)      │                      │                    │
   │                      │                       │                      │                    │
   │                      │<─ 返回图像 Base64 ─────┤                      │                    │
   │                      │                       │                      │                    │
   │                      ├─ SaveFile ─────────────────────────────────>│                    │
   │                      │                       │                      │                    │
   │                      │<─ 返回本地路径 ──────────────────────────────┤                    │
   │                      │                       │                      │                    │
   │<─ 显示图像 ───────────┤                       │                      │                    │
```

---

## 6. 状态管理策略

### 6.1 Phase 1：本地组件状态

**使用 React 内置状态**：
- 各组件使用 `useState` 管理自身状态
- 父子组件通过 props 传递数据
- 简单场景无需全局状态管理

**适用场景**：
- 项目列表状态（ProjectList 组件）
- API 配置状态（ApiKeySettings 组件）
- 历史记录状态（HistoryPanel 组件）

### 6.2 Phase 2：全局状态管理（Zustand）

**引入 Zustand**：
```typescript
// frontend/src/lib/store.ts
import { create } from 'zustand';

interface AppState {
  // 项目状态
  currentProject: Project | null;
  projects: Project[];

  // 画布状态
  nodes: Node[];
  edges: Edge[];

  // API 配置状态
  apiConfigs: ApiConfig[];

  // Actions
  setCurrentProject: (project: Project) => void;
  addNode: (node: Node) => void;
  updateNode: (id: string, data: any) => void;
  // ...
}

export const useAppStore = create<AppState>((set) => ({
  // 初始状态
  currentProject: null,
  projects: [],
  nodes: [],
  edges: [],
  apiConfigs: [],

  // Actions
  setCurrentProject: (project) => set({ currentProject: project }),
  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
  // ...
}));
```

---

## 7. 安全性设计

### 7.1 API Key 加密存储

**Windows (DPAPI)**：
```go
// services/security/keychain.go
func SaveApiKeyWindows(apiKey string) error {
    // 使用 Windows DPAPI 加密
    // 存储到: %LOCALAPPDATA%\Firebringer\credentials.dat
}

func LoadApiKeyWindows() (string, error) {
    // 使用 Windows DPAPI 解密
}
```

**macOS (Keychain)**：
```go
func SaveApiKeyMacOS(service string, account string, apiKey string) error {
    // 使用 macOS Keychain Services
}

func LoadApiKeyMacOS(service string, account string) (string, error) {
    // 从 macOS Keychain 读取
}
```

**Linux (Secret Service)**：
```go
func SaveApiKeyLinux(collection string, label string, apiKey string) error {
    // 使用 libsecret / GNOME Keyring
}

func LoadApiKeyLinux(collection string, label string) (string, error) {
    // 从 libsecret 读取
}
```

### 7.2 网络请求安全

- **仅 HTTPS**：所有 AI 模型 API 调用强制使用 HTTPS
- **API Key 不在日志中显示**：过滤敏感信息的日志输出
- **CORS 配置**：前端直接调用第三方 API，无需代理

---

## 8. 性能优化策略

### 8.1 前端优化

**画布性能**：
- 视口裁剪（仅渲染可见节点）
- 节点懒加载（离屏节点延迟渲染）
- 虚拟列表（历史记录、项目列表）

**缓存策略**：
- 图像/视频缩略图生成
- Base64 缓存减少重复请求
- 离线优先策略

### 8.2 后端优化

**数据库优化**：
- SQLite 索引（project_id, created_at）
- 批量查询（减少数据库访问次数）

**文件缓存优化**：
- 定期清理过期缓存（LRU 策略）
- 缓存大小限制（默认 5GB）

---

## 9. 错误处理策略

### 9.1 Go 后端错误处理

```go
// 统一错误响应
type ErrorResponse struct {
    Code    string `json:"code"`
    Message string `json:"message"`
    Details string `json:"details,omitempty"`
}

// 业务错误码
const (
    ErrProjectNotFound     = "PROJECT_NOT_FOUND"
    ErrInvalidApiConfig    = "INVALID_API_CONFIG"
    ErrFileSaveFailed      = "FILE_SAVE_FAILED"
    ErrDatabaseError       = "DATABASE_ERROR"
)
```

### 9.2 React 前端错误处理

```typescript
// frontend/src/lib/api.ts
export class ApiError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

// 统一错误处理
export async function handleApiCall<T>(
  apiCall: () => Promise<T>
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    // 显示错误提示（使用 shadcn/ui Toast）
    toast.error(error.message);
    throw error;
  }
}
```

---

## 10. 测试策略

### 10.1 单元测试

**Go 后端**：
- 数据库服务测试（使用内存 SQLite）
- 加密/解密功能测试
- 文件管理功能测试

**React 前端**：
- 组件测试（React Testing Library）
- Hook 测试（@testing-library/react-hooks）
- 工具函数测试（Vitest）

### 10.2 集成测试

- Wails IPC 通信测试
- 端到端流程测试（创建项目 → 保存 → 加载）

---

## 11. 部署与构建

### 11.1 开发环境

```bash
# 启动 Wails 开发服务器
wails dev

# 前端热重载
cd frontend && npm run dev
```

### 11.2 生产构建

```bash
# 构建 Windows 可执行文件
wails build -platform windows/amd64

# 构建 macOS 应用
wails build -platform darwin/amd64 -production

# 构建 Linux 应用
wails build -platform linux/amd64
```

---

## 12. 开发工作流

### 12.1 功能开发流程

1. **查看 PHASE1_TASKS.md**，确认当前任务
2. **在 Claude Code 中**：`"帮我实现 PHASE1_TASKS.md 中的任务 X.X"`
3. **Claude Code 执行**：
   - 创建/修改必要的 Go 文件
   - 创建/修改必要的 React 组件
   - 更新相关 README.md
4. **本地测试**：`wails dev`
5. **反馈问题**：如果有问题，继续让 Claude Code 修复

### 12.2 代码规范

- **Go**：遵循 `gofmt` 格式化
- **TypeScript**：遵循 ESLint + Prettier 规则
- **注释规范**：每个文件头添加 Input/Output/Pos 注释（参见 CLAUDE.md）
- **提交信息**：使用约定式提交（Conventional Commits）

---

## 13. 下一步

1. **查看 PHASE1_TASKS.md** - Phase 1 详细任务拆分
2. **开始第一个任务** - Week 1: 任务1.1（完善 Go 后端文件结构）

---

**文档维护**: 随着架构演进持续更新
**问题反馈**: 请在项目 Issue 中提出
