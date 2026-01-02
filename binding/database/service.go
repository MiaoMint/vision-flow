// Input: database package for data access (data access layer - provides database operations, data model definitions)
// Output: Service struct with methods bound to frontend JavaScript via Wails
// Position: Binding layer - exposes Go backend to frontend
//
// ⚠️ WHEN THIS FILE IS UPDATED:
// 1. Update this header comment
// 2. Update the parent folder's AI_ARCHITECTURE.md

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
	return db.GetConfig(db.AIProvider(provider))
}

// SaveAIConfig saves the configuration for a specific provider
func (s *Service) SaveAIConfig(config db.AIConfig) error {
	return db.SaveConfig(&config)
}

// DeleteAIConfig deletes the configuration for a specific provider
func (s *Service) DeleteAIConfig(provider string) error {
	return db.DeleteConfig(db.AIProvider(provider))
}

// ListAIConfigs returns all AI configurations
func (s *Service) ListAIConfigs() ([]db.AIConfig, error) {
	return db.ListConfigs()
}
