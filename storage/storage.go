package storage

import (
	"archive/zip"
	"encoding/base64"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

// GetAppConfigDir returns the application configuration directory.
// On macOS: ~/Library/Application Support/visionflow
// On Windows: %APPDATA%\visionflow
func GetAppConfigDir() (string, error) {
	configDir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}

	appDir := filepath.Join(configDir, "visionflow")
	if err := os.MkdirAll(appDir, 0755); err != nil {
		return "", err
	}

	return appDir, nil
}

// GetDatabasePath returns the absolute path to the database file.
func GetDatabasePath() (string, error) {
	appDir, err := GetAppConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(appDir, "visionflow.db"), nil
}

// SaveAssetContent saves the data to the assets directory with the given prefix and extension.
// It returns the filename (not full path) of the saved file.
func SaveAssetContent(data []byte, prefix string, ext string) (string, error) {
	assetsDir, err := GetAssetsDir()
	if err != nil {
		return "", err
	}

	filename := fmt.Sprintf("%s_%d%s", prefix, time.Now().UnixNano(), ext)
	fullPath := filepath.Join(assetsDir, filename)

	if err := os.WriteFile(fullPath, data, 0644); err != nil {
		return "", err
	}

	return filename, nil
}

// SaveBase64Content decodes a base64 string and saves it to the assets directory.
func SaveBase64Content(b64Data string, prefix string, ext string) (string, error) {
	data, err := base64.StdEncoding.DecodeString(b64Data)
	if err != nil {
		return "", fmt.Errorf("failed to decode base64 content: %w", err)
	}
	return SaveAssetContent(data, prefix, ext)
}

// SaveURLContent downloads content from a URL and saves it to the assets directory.
func SaveURLContent(url string, prefix string, ext string) (string, error) {
	resp, err := http.Get(url)
	if err != nil {
		return "", fmt.Errorf("failed to download content: %w", err)
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response body: %w", err)
	}

	return SaveAssetContent(data, prefix, ext)
}

// DeleteAssetContent deletes a file from the assets directory.
// filename should be just the filename, not a full path.
func DeleteAssetContent(filename string) error {
	assetsDir, err := GetAssetsDir()
	if err != nil {
		return err
	}

	fullPath := filepath.Join(assetsDir, filename)

	// Check if file exists
	if _, err := os.Stat(fullPath); os.IsNotExist(err) {
		return fmt.Errorf("file does not exist: %s", filename)
	}

	return os.Remove(fullPath)
}

// GetAssetsDir returns the directory where asset files (images, videos, audio) are stored.
func GetAssetsDir() (string, error) {
	appDir, err := GetAppConfigDir()
	if err != nil {
		return "", err
	}
	assetsDir := filepath.Join(appDir, "assets")
	if err := os.MkdirAll(assetsDir, 0755); err != nil {
		return "", err
	}
	return assetsDir, nil
}

// ZipAppConfigDir zips the entire application configuration directory to the destination path.
func ZipAppConfigDir(destPath string) error {
	sourceDir, err := GetAppConfigDir()
	if err != nil {
		return err
	}

	zipFile, err := os.Create(destPath)
	if err != nil {
		return err
	}
	defer zipFile.Close()

	archive := zip.NewWriter(zipFile)
	defer archive.Close()

	return filepath.Walk(sourceDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// Calculate relative path for zip header
		header, err := zip.FileInfoHeader(info)
		if err != nil {
			return err
		}

		relPath, err := filepath.Rel(sourceDir, path)
		if err != nil {
			return err
		}

		header.Name = relPath

		if info.IsDir() {
			header.Name += "/"
		} else {
			header.Method = zip.Deflate
		}

		writer, err := archive.CreateHeader(header)
		if err != nil {
			return err
		}

		if info.IsDir() {
			return nil
		}

		file, err := os.Open(path)
		if err != nil {
			return err
		}
		defer file.Close()

		_, err = io.Copy(writer, file)
		return err
	})
}
