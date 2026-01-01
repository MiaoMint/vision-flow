/**
 * Input: Wails runtime context (在应用启动时注入)
 * Output: App 实例，暴露给前端的方法（Greet 等）
 * Pos: Wails 应用的核心结构体，桥接 Go 后端与前端 React
 *
 * 一旦本文件被更新，务必更新：
 * 1. 本注释块
 * 2. 根目录的 README.md
 */
package main

import (
	"context"
	"fmt"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}
