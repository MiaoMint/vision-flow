package fileserver

import (
	"fmt"
	"io"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"visionflow/storage"
)

const (
	Host = "127.0.0.1"
	Port = 34116
)

// Start starts a local HTTP server to serve asset files with CORS enabled.
func Start() {
	assetsDir, err := storage.GetAssetsDir()
	if err != nil {
		fmt.Println("Error getting assets dir for file server:", err)
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

		filePath := filepath.Join(assetsDir, r.URL.Path)
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

	addr := fmt.Sprintf("%s:%d", Host, Port)
	fmt.Printf("Starting local file server on %s serving %s\n", addr, assetsDir)
	http.ListenAndServe(addr, handler)
}

// GetFileUrl returns the full URL for a file served by the file server
func GetFileUrl(path string) string {
	return fmt.Sprintf("http://%s:%d/%s", Host, Port, path)
}
