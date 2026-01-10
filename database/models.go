package database

import "time"

type AIProvider string

const (
	ProviderGemini AIProvider = "gemini"
	ProviderOpenAI AIProvider = "openai"
	ProviderClaude AIProvider = "claude"
)

// ModelProvider represents an AI model provider configuration
type ModelProvider struct {
	ID        int        `db:"id" json:"id"`
	Name      string     `db:"name" json:"name"`
	Type      AIProvider `db:"type" json:"type"`
	APIKey    string     `db:"api_key" json:"apiKey"`
	BaseURL   string     `db:"base_url" json:"baseUrl"`
	CreatedAt time.Time  `db:"created_at" json:"createdAt"`
	UpdatedAt time.Time  `db:"updated_at" json:"updatedAt"`
}

// Project represents a project entity
type Project struct {
	ID          int       `db:"id" json:"id"`
	Name        string    `db:"name" json:"name"`
	Description string    `db:"description" json:"description"`
	Workflow    string    `db:"workflow" json:"workflow"`
	CoverImage  string    `db:"cover_image" json:"coverImage"`
	CreatedAt   time.Time `db:"created_at" json:"createdAt"`
	UpdatedAt   time.Time `db:"updated_at" json:"updatedAt"`
}

type AssetType string

const (
	AssetTypeImage AssetType = "image"
	AssetTypeVideo AssetType = "video"
	AssetTypeAudio AssetType = "audio"
)

// Asset represents a stored item (image/video/audio) associated with a project/workflow
type Asset struct {
	ID        int       `db:"id" json:"id"`
	ProjectID int       `db:"project_id" json:"projectId"`
	Type      AssetType `db:"type" json:"type"`
	Path      string    `db:"path" json:"path"`
	CreatedAt time.Time `db:"created_at" json:"createdAt"`
	UpdatedAt time.Time `db:"updated_at" json:"updatedAt"`
}
