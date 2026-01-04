package storage

import (
	"encoding/base64"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

// GetAppConfigDir returns the application configuration directory.
// On macOS: ~/Library/Application Support/firebringer
// On Windows: %APPDATA%\firebringer
func GetAppConfigDir() (string, error) {
	configDir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}

	appDir := filepath.Join(configDir, "firebringer")
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
	return filepath.Join(appDir, "firebringer.db"), nil
}

// GetGeneratedDir returns the directory where generated content is saved.
func GetGeneratedDir() (string, error) {
	appDir, err := GetAppConfigDir()
	if err != nil {
		return "", err
	}
	genDir := filepath.Join(appDir, "generated")
	if err := os.MkdirAll(genDir, 0755); err != nil {
		return "", err
	}
	return genDir, nil
}

// SaveGeneratedContent saves the data to the generated directory with the given prefix and extension.
// It returns the filename (not full path) of the saved file.
func SaveGeneratedContent(data []byte, prefix string, ext string) (string, error) {
	genDir, err := GetGeneratedDir()
	if err != nil {
		return "", err
	}

	filename := fmt.Sprintf("%s_%d%s", prefix, time.Now().UnixNano(), ext)
	fullPath := filepath.Join(genDir, filename)

	if err := os.WriteFile(fullPath, data, 0644); err != nil {
		return "", err
	}

	return filename, nil
}

// SaveBase64Content decodes a base64 string and saves it to the generated directory.
func SaveBase64Content(b64Data string, prefix string, ext string) (string, error) {
	data, err := base64.StdEncoding.DecodeString(b64Data)
	if err != nil {
		return "", fmt.Errorf("failed to decode base64 content: %w", err)
	}
	return SaveGeneratedContent(data, prefix, ext)
}

// SaveURLContent downloads content from a URL and saves it to the generated directory.
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

	return SaveGeneratedContent(data, prefix, ext)
}
