# Post-Write Hook

## 触发时机

每次 `Edit` / `Write` 操作完成后自动执行。

## 检查项

### 1. 文件头注释检查

对于 `.ts` / `.tsx` / `.go` 文件，检查前20行是否包含：

```
Input:
Output:
Pos:
```

**如果缺失** → 输出提醒（不阻止写入）：

```
⚠️  文件头缺少 Input/Output/Pos 注释
请参考 .claude/CLAUDE.md 中的文件头注释规范
```

### 2. 文件夹 README 检查

当创建新文件时，检查所属文件夹是否存在 `README.md`。

**如果缺失** → 输出提醒：

```
⚠️  文件夹 {folder} 缺少 README.md
请参考 .claude/CLAUDE.md 中的文件夹 README 规范
```

### 3. 根文档联动检查

当修改以下文件时，提醒检查联动：

| 修改的文件 | 检查联动 |
|-----------|---------|
| `PRD.md` | 技术文档是否需要同步更新 |
| `frontend/src/` 下的核心组件 | `docs/components/` 是否需要更新 |
| `main.go` | `docs/architecture/` 是否需要更新 |

---

## 实现方式

Claude Code 会在每次写入后：
1. 读取文件前20行
2. 检查是否包含必需的注释块
3. 输出检查结果
