package database

import (
	"database/sql"
	"errors"
)

// GetModelProviderByType retrieves a model provider configuration by its type (e.g., openai, gemini)
// Note: Returns the first one found if multiple exist for the same type.
func GetModelProviderByType(providerType AIProvider) (*ModelProvider, error) {
	var config ModelProvider
	err := DB.Get(&config, "SELECT * FROM model_providers WHERE type = ? LIMIT 1", providerType)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil // Not found
		}
		return nil, err
	}
	return &config, nil
}

// GetModelProvider retrieves a model provider configuration by ID
func GetModelProvider(id int) (*ModelProvider, error) {
	var config ModelProvider
	err := DB.Get(&config, "SELECT * FROM model_providers WHERE id = ?", id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil // Not found
		}
		return nil, err
	}
	return &config, nil
}

// SaveModelProvider saves or updates a model provider configuration
func SaveModelProvider(config ModelProvider) error {
	if config.ID == 0 {
		// Insert
		_, err := DB.NamedExec(`
            INSERT INTO model_providers (name, type, api_key, base_url, created_at, updated_at)
            VALUES (:name, :type, :api_key, :base_url, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, config)
		return err
	}

	// Update
	_, err := DB.NamedExec(`
		UPDATE model_providers 
		SET name = :name, type = :type, api_key = :api_key, base_url = :base_url, updated_at = CURRENT_TIMESTAMP
		WHERE id = :id
	`, config)
	return err
}

// DeleteModelProvider deletes a model provider configuration
func DeleteModelProvider(id int) error {
	print(id)
	_, err := DB.Exec("DELETE FROM model_providers WHERE id = ?", id)
	return err
}

// ListModelProviders lists all model provider configurations
func ListModelProviders() ([]ModelProvider, error) {
	var configs []ModelProvider
	err := DB.Select(&configs, "SELECT * FROM model_providers ORDER BY type, name")
	if err != nil {
		return nil, err
	}
	return configs, nil
}
