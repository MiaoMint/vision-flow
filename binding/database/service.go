package database

import (
	db "firebringer/database"
)

// Service provides database methods for the frontend
type Service struct{}

// NewService creates a new Database Service
func NewService() *Service {
	return &Service{}
}

// GetAIConfig returns the configuration for a specific provider
func (s *Service) GetAIConfig(provider string) (*db.AIConfig, error) {
	return db.GetAIConfig(db.AIProvider(provider))
}

// SaveAIConfig saves the configuration for a specific provider
func (s *Service) SaveAIConfig(config db.AIConfig) error {
	return db.SaveAIConfig(&config)
}

// DeleteAIConfig deletes the configuration for a specific provider
func (s *Service) DeleteAIConfig(provider string) error {
	return db.DeleteAIConfig(db.AIProvider(provider))
}

// ListAIConfigs returns all AI configurations
func (s *Service) ListAIConfigs() ([]db.AIConfig, error) {
	return db.ListAIConfigs()
}
