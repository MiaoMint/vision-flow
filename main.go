package main

import (
	"embed"
	"fmt"
	"net/http"

	bindingAI "visionflow/binding/ai"
	bindingApp "visionflow/binding/app"
	bindingDB "visionflow/binding/database"
	"visionflow/database"
	serviceAI "visionflow/service/ai"
	"visionflow/storage"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed wails.json
var wailsJSON string

// startFileServer starts a local HTTP server to serve generated files with CORS enabled.
func startFileServer() {
	genDir, err := storage.GetGeneratedDir()
	if err != nil {
		fmt.Println("Error getting generated dir for file server:", err)
		return
	}

	fs := http.FileServer(http.Dir(genDir))

	// CORS wrapper
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "*")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		fmt.Printf("[FileServer] Request: %s\n", r.URL.Path)
		fs.ServeHTTP(w, r)
	})

	fmt.Println("Starting local file server on :34116 serving", genDir)
	if err := http.ListenAndServe(":34116", handler); err != nil {
		fmt.Println("Error starting file server:", err)
	}
}

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
	go startFileServer()

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
		OnStartup:         aiService.SetContext,
		Mac: &mac.Options{
			TitleBar: mac.TitleBarHiddenInset(),
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
