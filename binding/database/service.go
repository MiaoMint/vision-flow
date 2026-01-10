package database

import (
	db "firebringer/database"
	"fmt"
)

type Service struct{}

func NewService() *Service {
	return &Service{}
}

// GetModelProvider retrieves a model provider configuration by ID
func (s *Service) GetModelProvider(id int) (*db.ModelProvider, error) {
	return db.GetModelProvider(id)
}

// SaveModelProvider saves or updates a model provider configuration
func (s *Service) SaveModelProvider(config db.ModelProvider) error {
	return db.SaveModelProvider(config)
}

// DeleteModelProvider deletes a model provider configuration
func (s *Service) DeleteModelProvider(id int) error {
	return db.DeleteModelProvider(id)
}

// ListModelProviders lists all model provider configurations
func (s *Service) ListModelProviders() ([]db.ModelProvider, error) {
	return db.ListModelProviders()
}

// GetProject retrieves a project by ID
func (s *Service) GetProject(id int) (*db.Project, error) {
	return db.GetProject(id)
}

// SaveProject saves or updates a project
func (s *Service) SaveProject(project db.Project) (*db.Project, error) {
	return db.SaveProject(project)
}

// DeleteProject deletes a project
func (s *Service) DeleteProject(id int) error {
	return db.DeleteProject(id)
}

// ListProjects lists all projects
func (s *Service) ListProjects() ([]db.Project, error) {
	return db.ListProjects()
}

// ListAssets lists all assets for a project (pass 0 for all)
func (s *Service) ListAssets(projectID int) ([]db.Asset, error) {
	assets, err := db.ListAssets(projectID)
	if err != nil {
		return nil, err
	}
	for i := range assets {
		assets[i].URL = fmt.Sprintf("http://localhost:34116/%s", assets[i].Path)
	}
	return assets, nil
}

// DeleteAsset deletes an asset
func (s *Service) DeleteAsset(id int) error {
	return db.DeleteAsset(id)
}
