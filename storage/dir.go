// Input: None (standard library only)
// Output: GetAppConfigDir and GetDatabasePath functions for use by database initialization
// Position: Path management - provides cross-platform file system paths
//
// ⚠️ WHEN THIS FILE IS UPDATED:
// 1. Update this header comment
// 2. Update the parent folder's AI_ARCHITECTURE.md

package storage

import (
	"os"
	"path/filepath"
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
