package database

import "time"

type AIProvider string

const (
	ProviderGemini AIProvider = "gemini"
	ProviderOpenAI AIProvider = "openai"
	ProviderClaude AIProvider = "claude"
)

type AIConfig struct {
	Provider  AIProvider `db:"provider" json:"provider"`
	APIKey    string     `db:"api_key" json:"apiKey"`
	BaseURL   string     `db:"base_url" json:"baseUrl"`
	CreatedAt time.Time  `db:"created_at" json:"createdAt"`
	UpdatedAt time.Time  `db:"updated_at" json:"updatedAt"`
}
