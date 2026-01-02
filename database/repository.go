// Input: Global DB instance from db.go (database initialization), models from models.go (data model definitions)
// Output: CRUD functions (GetConfig, SaveConfig, DeleteConfig, ListConfigs) for use by binding layer
// Position: Data access layer - provides database operations
//
// ⚠️ WHEN THIS FILE IS UPDATED:
// 1. Update this header comment
// 2. Update the parent folder's AI_ARCHITECTURE.md

package database

import (
	"database/sql"
	"fmt"
	"log"
)

func GetConfig(provider AIProvider) (*AIConfig, error) {
	config := AIConfig{}
	err := DB.Get(&config, "SELECT * FROM ai_configs WHERE provider = ?", provider)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &config, nil
}

func SaveConfig(config *AIConfig) error {
	log.Println("Saving config:", config)
	if config.Provider == "" {
		return fmt.Errorf("provider is required")
	}

	// Upsert logic for SQLite
	query := `
	INSERT INTO ai_configs (provider, api_key, base_url, updated_at)
	VALUES (:provider, :api_key, :base_url, CURRENT_TIMESTAMP)
	ON CONFLICT(provider) DO UPDATE SET
		api_key = excluded.api_key,
		base_url = excluded.base_url,
		updated_at = CURRENT_TIMESTAMP;
	`
	_, err := DB.NamedExec(query, config)
	return err
}

func DeleteConfig(provider AIProvider) error {
	_, err := DB.Exec("DELETE FROM ai_configs WHERE provider = ?", provider)
	return err
}

func ListConfigs() ([]AIConfig, error) {
	configs := []AIConfig{}
	err := DB.Select(&configs, "SELECT * FROM ai_configs ORDER BY created_at DESC")
	return configs, err
}
