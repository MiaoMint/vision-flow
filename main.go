// Input: Wails v2 framework, database package for initialization (database initialization), binding/database for service exposure (binding layer - exposes Go backend to frontend)
// Output: Configured and running desktop application instance
// Position: Application entry point - initializes database, creates Wails app, binds Go services to JavaScript
//
// ⚠️ WHEN THIS FILE IS UPDATED:
// 1. Update this header comment
// 2. Update the parent folder's AI_ARCHITECTURE.md

package main

import (
	"embed"
	bindingDB "firebringer/binding/database"
	"firebringer/database"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Initialize database
	if err := database.InitDB(); err != nil {
		println("Error initializing database:", err.Error())
		return
	}

	// Create an instance of the app structure
	dbService := bindingDB.NewService()

	// Create application with options
	err := wails.Run(&options.App{
		Title:     "firebringer",
		Width:     1280,
		Height:    768,
		MinWidth:  800,
		MinHeight: 600,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		Bind: []interface{}{
			dbService,
		},
		Mac: &mac.Options{
			TitleBar: mac.TitleBarHiddenInset(),
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
