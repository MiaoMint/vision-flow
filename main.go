package main

import (
	"embed"
	bindingAI "firebringer/binding/ai"
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
	aiService := bindingAI.NewService()

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
			aiService,
		},
		OnStartup: aiService.SetContext,
		Mac: &mac.Options{
			TitleBar: mac.TitleBarHiddenInset(),
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
