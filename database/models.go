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
	ID             int       `db:"id" json:"id"`
	ProjectID      int       `db:"project_id" json:"projectId"`
	Type           AssetType `db:"type" json:"type"`
	Path           string    `db:"path" json:"path"`
	URL            string    `db:"-" json:"url"`
	IsUserProvided bool      `db:"is_user_provided" json:"isUserProvided"`
	MD5            string    `db:"md5" json:"md5"`
	CreatedAt      time.Time `db:"created_at" json:"createdAt"`
	UpdatedAt      time.Time `db:"updated_at" json:"updatedAt"`
}

// UserPreference represents a user preference key-value pair
type UserPreference struct {
	Key       string    `db:"key" json:"key"`
	Value     string    `db:"value" json:"value"`
	CreatedAt time.Time `db:"created_at" json:"createdAt"`
	UpdatedAt time.Time `db:"updated_at" json:"updatedAt"`
}

// ChatSession represents a chat session associated with a project
type ChatSession struct {
	ID        int       `db:"id" json:"id"`
	ProjectID int       `db:"project_id" json:"projectId"`
	Title     string    `db:"title" json:"title"`
	CreatedAt time.Time `db:"created_at" json:"createdAt"`
	UpdatedAt time.Time `db:"updated_at" json:"updatedAt"`
}

// ChatMessage represents a single message in a chat session
type ChatMessage struct {
	ID        int       `db:"id" json:"id"`
	SessionID int       `db:"session_id" json:"sessionId"`
	Role      string    `db:"role" json:"role"`
	Content   string    `db:"content" json:"content"`
	CreatedAt time.Time `db:"created_at" json:"createdAt"`
}
