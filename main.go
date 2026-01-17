package main

import (
	"context"
	"embed"
	"strings"

	bindingAI "visionflow/binding/ai"
	bindingApp "visionflow/binding/app"
	bindingDB "visionflow/binding/database"
	"visionflow/database"
	serviceAI "visionflow/service/ai"
	"visionflow/service/fileserver"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed wails.json
var wailsJSON string

func main() {
	// Initialize database
	if err := database.InitDB(); err != nil {
		println("Error initializing database:", err.Error())
		return
	}

	// Initialize AI capabilities (model data)
	if err := serviceAI.InitCapabilities(); err != nil {
		println("Error initializing AI capabilities:", err.Error())
		// We could return here, but maybe it's better to continue as it has fallback
	}

	// Create an instance of the app structure
	dbService := bindingDB.NewService()
	aiService := bindingAI.NewService()
	appService := bindingApp.NewService(wailsJSON)

	// Start the local file server
	go fileserver.Start()

	// Create application with options
	err := wails.Run(&options.App{
		Title:     "VisionFlow",
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
			appService,
		},
		HideWindowOnClose: true,
		OnStartup: func(ctx context.Context) {
			bindingApp.WailsContext = &ctx
		},
		SingleInstanceLock: &options.SingleInstanceLock{
			UniqueId: "3e347bce-745e-4dd3-a6de-c6e6e2a44c86",
			OnSecondInstanceLaunch: func(secondInstanceData options.SecondInstanceData) {
				secondInstanceArgs := secondInstanceData.Args
				println("user opened second instance", strings.Join(secondInstanceData.Args, ","))
				println("user opened second from", secondInstanceData.WorkingDirectory)
				runtime.WindowUnminimise(*bindingApp.WailsContext)
				runtime.Show(*bindingApp.WailsContext)
				go runtime.EventsEmit(*bindingApp.WailsContext, "launchArgs", secondInstanceArgs)
			},
		},
		Mac: &mac.Options{
			TitleBar: mac.TitleBarHiddenInset(),
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
