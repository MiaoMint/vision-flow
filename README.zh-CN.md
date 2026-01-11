# VisioFlow

<div align="center">
  <img src="build/appicon.png" alt="VisioFlow Logo" width="128" height="128">
  <p><strong>基于节点的可视化 AI 内容生成工作流编辑器</strong></p>
</div>

<div align="center">
  简体中文 | <a href="README.md">English</a>
</div>

## ✨ 功能特性

- **可视化工作流编辑器**：基于 ReactFlow 的拖拽式节点编辑界面
- **多模态 AI 支持**：生成文本、图像、视频和音频内容
- **多 AI 提供商**：集成 OpenAI、Claude 和 Gemini
- **本地资源管理**：内置资源库，本地文件存储
- **项目管理**：保存、加载和管理多个工作流项目
- **跨平台**：支持 macOS、Windows 和 Linux 的原生桌面应用

## 📸 截图

<div align="center">
  <img src="screenshot/workflow.png" alt="工作流编辑器" width="90%">
  <p><em>可视化节点工作流编辑器</em></p>
</div>


<div align="center">
  <img src="screenshot/light_projects.png" alt="亮色主题" width="45%">
  <img src="screenshot/dark_projects.png" alt="暗色主题" width="45%">
  <p><em>支持亮色和暗色主题</em></p>
</div>


## 🛠️ 技术栈

**后端：**
- Go 1.24
- Wails v2（桌面应用框架）
- SQLite（sqlx + go-sqlite3）
- AI SDK：anthropic-sdk-go、go-openai、google genai

**前端：**
- React 19 + TypeScript
- Vite 7（构建工具）
- ReactFlow（@xyflow/react）- 可视化画布
- Tailwind CSS 4 - 样式
- shadcn/ui - UI 组件库

## 🚀 快速开始

### 环境要求

- Go 1.24+
- Node.js 18+ 和 pnpm
- Wails CLI：`go install github.com/wailsapp/wails/v2/cmd/wails@latest`

### 安装

```bash
# 克隆仓库
git clone https://github.com/yourusername/visionflow.git
cd visionflow

# 安装前端依赖
cd frontend
pnpm install
cd ..
```

### 开发

运行热重载的开发模式：

```bash
wails dev
```

应用将启动并包含：
- 带有 React 应用的主窗口
- 开发服务器 http://localhost:34115（用于浏览器测试 Go 方法）
- 本地文件服务器 http://localhost:34116（用于生成的资源）

### 构建

构建生产就绪的安装包：

```bash
wails build
```

可执行文件将生成在 `build/bin/` 目录。

## 📖 使用说明

### 创建工作流

1. 从侧边栏创建新项目
2. 向画布添加节点（文本、图像、视频、音频）
3. 通过拖拽输出到输入句柄来连接节点
4. 为每个节点配置 AI 提供商和模型
5. 点击"运行"执行节点并生成内容
6. 在资源库中查看生成的资源

### 节点类型

- **文本节点**：使用 LLM 生成文本内容
- **图像节点**：从文本描述生成图像
- **视频节点**：从提示创建视频
- **音频节点**：生成音频/语音内容
- **分组节点**：组织和分组多个节点

### 连接节点

节点可以将内容传递给下游节点：
- 将一个节点的输出句柄连接到另一个节点的输入句柄
- 源节点的输出成为目标节点的输入上下文
- 支持多种输入（文本、图像、视频、音频）

## 🔧 配置

### AI 提供商设置

1. 打开设置（齿轮图标）
2. 导航到"模型提供商"
3. 添加您的 API 密钥：
   - OpenAI（文本、图像生成）
   - Claude（文本生成）
   - Gemini（文本生成）

### 存储位置

- **数据库**：`~/Library/Application Support/visionflow/visionflow.db`
- **生成的资源**：`~/Library/Application Support/visionflow/generated/`
- **模型能力**：`~/Library/Application Support/visionflow/model_data.json`

## 💻 开发指南

### 项目结构

```
visionflow/
├── main.go                 # 应用入口
├── binding/                # Wails 绑定（暴露给前端）
│   ├── ai/                # AI 服务绑定
│   └── database/          # 数据库服务绑定
├── service/                # 核心业务逻辑
│   ├── ai/                # AI 提供商实现
│   └── storage/           # 文件存储工具
├── database/               # 数据持久化层
│   ├── models.go          # 数据模型
│   └── repository.go      # 数据库操作
└── frontend/               # React 应用
    ├── src/
    │   ├── components/    # UI 组件
    │   │   ├── nodes/     # 节点实现
    │   │   ├── settings/  # 设置对话框
    │   │   └── ui/        # shadcn/ui 组件
    │   └── hooks/         # 自定义 React Hooks
    └── wailsjs/           # 自动生成的 Wails 绑定
```

### 添加新的 AI 提供商

1. 在 `service/ai/{provider}.go` 中实现 `AIClient` 接口
2. 在 `NewClient()` 工厂函数中添加提供商分支（`service/ai/utils.go`）
3. 在 `database/models.go` 中添加提供商常量
4. 更新 `model_data.json` 添加提供商的模型
5. 通过 `binding/ai/service.go` 暴露方法

### 关键开发模式

- **服务层优先**：先在 `service/` 中实现逻辑，再通过 `binding/` 暴露
- **Wails 绑定**：永远不要手动编辑 `frontend/wailsjs/go/` - 它们是自动生成的
- **节点执行**：使用 `useNodeRun` Hook，通过 `runTrigger` UUID 管理状态
- **资源访问**：前端使用 `http://localhost:34116/{filename}` 访问生成的文件

## 🤝 贡献

欢迎贡献！请随时提交 Pull Request。

## 📄 许可证

本项目采用 Creative Commons Attribution 4.0 International License 许可 - 详见 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- [Wails](https://wails.io/) - 桌面应用框架
- [ReactFlow](https://reactflow.dev/) - 基于节点的可视化编辑器
- [shadcn/ui](https://ui.shadcn.com/) - UI 组件库

## 📞 支持

问题和功能请求请使用 [GitHub Issues](https://github.com/miaomint/vision-flow/issues) 页面。
