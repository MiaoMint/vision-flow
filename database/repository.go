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
		UPDATE projects 
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

// GetProject retrieves a project by ID
func GetProject(id int) (*Project, error) {
	var project Project
	err := DB.Get(&project, "SELECT * FROM projects WHERE id = ?", id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil // Not found
		}
		return nil, err
	}
	return &project, nil
}

// SaveProject saves or updates a project
func SaveProject(project Project) (*Project, error) {
	if project.ID == 0 {
		// Insert
		result, err := DB.NamedExec(`
            INSERT INTO projects (name, description, workflow, cover_image, created_at, updated_at)
            VALUES (:name, :description, :workflow, :cover_image, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, project)
		if err != nil {
			return nil, err
		}
		id, err := result.LastInsertId()
		if err != nil {
			return nil, err
		}
		project.ID = int(id)
		return GetProject(project.ID)
	}

	// Update
	_, err := DB.NamedExec(`
		UPDATE projects 
		SET name = :name, description = :description, workflow = :workflow, cover_image = :cover_image, updated_at = CURRENT_TIMESTAMP
		WHERE id = :id
	`, project)
	if err != nil {
		return nil, err
	}
	return GetProject(project.ID)
}

// DeleteProject deletes a project
func DeleteProject(id int) error {
	_, err := DB.Exec("DELETE FROM projects WHERE id = ?", id)
	return err
}

// ListProjects lists all projects
func ListProjects() ([]Project, error) {
	var projects []Project
	err := DB.Select(&projects, "SELECT * FROM projects ORDER BY updated_at DESC")
	if err != nil {
		return nil, err
	}
	return projects, nil
}
