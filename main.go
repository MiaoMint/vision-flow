package main

import (
	"context"
	"embed"
	"fmt"
	"io"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

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
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed wails.json
var wailsJSON string

var wailsContext *context.Context

// startFileServer starts a local HTTP server to serve generated files with CORS enabled.
func startFileServer() {
	genDir, err := storage.GetGeneratedDir()
	if err != nil {
		fmt.Println("Error getting generated dir for file server:", err)
		return
	}

	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "*")
			w.WriteHeader(http.StatusOK)
			return
		}

		filePath := filepath.Join(genDir, r.URL.Path)
		file, err := os.Open(filePath)
		if err != nil {
			http.NotFound(w, r)
			return
		}
		defer file.Close()

		fileInfo, err := file.Stat()
		if err != nil {
			http.Error(w, "Error getting file info", http.StatusInternalServerError)
			return
		}

		fileSize := fileInfo.Size()
		contentType := mime.TypeByExtension(filepath.Ext(filePath))
		if contentType == "" {
			contentType = "application/octet-stream"
		}

		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Content-Type", contentType)
		w.Header().Set("Accept-Ranges", "bytes")

		// Handle Range request
		rangeHeader := r.Header.Get("Range")
		if rangeHeader != "" {
			ranges := strings.TrimPrefix(rangeHeader, "bytes=")
			parts := strings.Split(ranges, "-")

			start, _ := strconv.ParseInt(parts[0], 10, 64)
			end := fileSize - 1
			if len(parts) > 1 && parts[1] != "" {
				end, _ = strconv.ParseInt(parts[1], 10, 64)
			}

			if start > end || start < 0 || end >= fileSize {
				w.WriteHeader(http.StatusRequestedRangeNotSatisfiable)
				return
			}

			contentLength := end - start + 1
			w.Header().Set("Content-Range", fmt.Sprintf("bytes %d-%d/%d", start, end, fileSize))
			w.Header().Set("Content-Length", strconv.FormatInt(contentLength, 10))
			w.WriteHeader(http.StatusPartialContent)

			file.Seek(start, 0)
			io.CopyN(w, file, contentLength)
		} else {
			w.Header().Set("Content-Length", strconv.FormatInt(fileSize, 10))
			buffer := make([]byte, 32*1024)
			io.CopyBuffer(w, file, buffer)
		}
	})

	fmt.Println("Starting local file server on 127.0.0.1:34116 serving", genDir)
	http.ListenAndServe("127.0.0.1:34116", handler)
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
		OnStartup: func(ctx context.Context) {
			wailsContext = &ctx
		},
		SingleInstanceLock: &options.SingleInstanceLock{
			UniqueId: "3e347bce-745e-4dd3-a6de-c6e6e2a44c86",
			OnSecondInstanceLaunch: func(secondInstanceData options.SecondInstanceData) {
				secondInstanceArgs := secondInstanceData.Args
				println("user opened second instance", strings.Join(secondInstanceData.Args, ","))
				println("user opened second from", secondInstanceData.WorkingDirectory)
				runtime.WindowUnminimise(*wailsContext)
				runtime.Show(*wailsContext)
				go runtime.EventsEmit(*wailsContext, "launchArgs", secondInstanceArgs)
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
