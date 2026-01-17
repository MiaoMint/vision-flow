package database

import (
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"os"
	"path/filepath"
	"time"
	db "visionflow/database"
	"visionflow/service/fileserver"
	"visionflow/storage"
)

type Service struct {
}

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
		assets[i].URL = fileserver.GetFileUrl(assets[i].Path)
	}
	return assets, nil
}

// DeleteAsset deletes an asset
func (s *Service) DeleteAsset(id int) error {
	return db.DeleteAsset(id)
}

// CreateAssetFromFile saves a file provided as bytes as an asset
func (s *Service) CreateAssetFromFile(name string, data []byte) (*db.Asset, error) {
	// Calculate MD5 hash
	hash := md5.Sum(data)
	md5Hash := hex.EncodeToString(hash[:])

	// Check if asset with same MD5 already exists
	existingAsset, err := db.GetAssetByMD5(md5Hash)
	if err != nil {
		return nil, fmt.Errorf("failed to check for existing asset: %w", err)
	}
	if existingAsset != nil {
		// Return existing asset with URL
		existingAsset.URL = fileserver.GetFileUrl(existingAsset.Path)
		return existingAsset, nil
	}

	// Determine file extension
	ext := filepath.Ext(name)
	if ext == "" {
		ext = ".dat"
	}

	// Generate filename
	filename := fmt.Sprintf("file_%d%s", time.Now().Unix(), ext)

	// Save to storage
	assetsDir, err := storage.GetAssetsDir()
	if err != nil {
		return nil, fmt.Errorf("failed to get assets directory: %w", err)
	}
	destPath := filepath.Join(assetsDir, filename)
	if err := os.WriteFile(destPath, data, 0644); err != nil {
		return nil, fmt.Errorf("failed to save file: %w", err)
	}

	// Determine asset type
	var assetType db.AssetType
	switch ext {
	case ".png", ".jpg", ".jpeg", ".gif", ".webp":
		assetType = db.AssetTypeImage
	case ".mp4", ".mov", ".avi", ".webm":
		assetType = db.AssetTypeVideo
	case ".mp3", ".wav", ".ogg":
		assetType = db.AssetTypeAudio
	}

	// Create asset record
	asset := db.Asset{
		Type:           assetType,
		Path:           filename,
		IsUserProvided: true,
		MD5:            md5Hash,
	}

	createdAsset, err := db.CreateAsset(asset)
	if err != nil {
		// Clean up file if database insert fails
		os.Remove(destPath)
		return nil, fmt.Errorf("failed to create asset record: %w", err)
	}

	// Add URL for immediate use
	createdAsset.URL = fileserver.GetFileUrl(createdAsset.Path)
	return createdAsset, nil
}
