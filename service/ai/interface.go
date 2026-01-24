package ai

import (
	"context"
	"fmt"
	"visionflow/database"
)

// TextGenerateRequest defines the parameters for text generation
type TextGenerateRequest struct {
	Prompt      string         `json:"prompt"`
	Images      []string       `json:"images,omitempty"`
	Videos      []string       `json:"videos,omitempty"`
	Audios      []string       `json:"audios,omitempty"`
	Documents   []string       `json:"documents,omitempty"`
	Model       string         `json:"model"`
	Temperature *float64       `json:"temperature,omitempty"`
	MaxTokens   *int           `json:"maxTokens,omitempty"`
	Options     map[string]any `json:"options,omitempty"`
}

// TextGenerateResponse defines the response for text generation
type TextGenerateResponse struct {
	Content      string `json:"content"`
	PromptTokens int    `json:"promptTokens"`
	OutputTokens int    `json:"outputTokens"`
	TotalTokens  int    `json:"totalTokens"`
	Model        string `json:"model"`
}

// ImageGenerateRequest defines the parameters for image generation
type ImageGenerateRequest struct {
	Prompt  string         `json:"prompt"`
	Images  []string       `json:"images,omitempty"`
	Videos  []string       `json:"videos,omitempty"`
	Audios  []string       `json:"audios,omitempty"`
	Model   string         `json:"model"`
	Size    string         `json:"size,omitempty"`
	Quality string         `json:"quality,omitempty"`
	Style   string         `json:"style,omitempty"`
	Options map[string]any `json:"options,omitempty"`
}

// ImageGenerateResponse defines the response for image generation
type ImageGenerateResponse struct {
	URL           string `json:"url,omitempty"`
	B64JSON       string `json:"b64_json,omitempty"`
	Data          []byte `json:"data,omitempty"`
	RevisedPrompt string `json:"revised_prompt,omitempty"`
	Model         string `json:"model"`
}

// AudioGenerateRequest defines the parameters for audio generation
type AudioGenerateRequest struct {
	Prompt  string         `json:"prompt"`
	Images  []string       `json:"images,omitempty"`
	Videos  []string       `json:"videos,omitempty"`
	Audios  []string       `json:"audios,omitempty"`
	Model   string         `json:"model"`
	Voice   string         `json:"voice,omitempty"`
	Speed   *float64       `json:"speed,omitempty"`
	Options map[string]any `json:"options,omitempty"`
}

// AudioGenerateResponse defines the response for audio generation
type AudioGenerateResponse struct {
	Data  []byte `json:"data,omitempty"` // Raw audio data
	Model string `json:"model"`
}

// VideoGenerateRequest defines the parameters for video generation
type VideoGenerateRequest struct {
	Prompt     string         `json:"prompt"`
	Images     []string       `json:"images,omitempty"`
	Videos     []string       `json:"videos,omitempty"`
	Audios     []string       `json:"audios,omitempty"`
	Model      string         `json:"model"`
	Duration   string         `json:"duration,omitempty"`
	Resolution string         `json:"resolution,omitempty"`
	Options    map[string]any `json:"options,omitempty"`
}

// VideoGenerateResponse defines the response for video generation
type VideoGenerateResponse struct {
	Data  []byte `json:"data,omitempty"` // Raw video data or URL
	URL   string `json:"url,omitempty"`
	Model string `json:"model"`
}

// Model represents an AI model
type Model struct {
	ID           string   `json:"id"`
	Owner        string   `json:"owner,omitempty"`
	Created      int64    `json:"created,omitempty"`
	Object       string   `json:"object,omitempty"`
	ProviderName string   `json:"provider_name,omitempty"`
	ProviderType string   `json:"provider_type,omitempty"`
	Input        []string `json:"input,omitempty"`
	Output       []string `json:"output,omitempty"`
}

// AIClient defines the interface that all AI providers must implement
type AIClient interface {
	GenerateText(ctx context.Context, req TextGenerateRequest) (*TextGenerateResponse, error)
	GenerateImage(ctx context.Context, req ImageGenerateRequest) (*ImageGenerateResponse, error)
	GenerateAudio(ctx context.Context, req AudioGenerateRequest) (*AudioGenerateResponse, error)
	GenerateVideo(ctx context.Context, req VideoGenerateRequest) (*VideoGenerateResponse, error)
	CanvasAgent(ctx context.Context, req CanvasEditRequest, onEvent func(string, any)) error
	ListModels(ctx context.Context) ([]Model, error)
}

// CanvasEditRequest defines the parameters for canvas editing
type CanvasEditRequest struct {
	SessionID string              `json:"sessionId"` // Add session ID for state tracking
	Prompt    string              `json:"prompt"`
	Model     string              `json:"model"`
	History   []map[string]string `json:"history,omitempty"` // Chat history
}

// NewClient creates a new AI client based on the configuration
func NewClient(config database.ModelProvider) (AIClient, error) {
	switch config.Type {
	case database.ProviderGemini:
		return NewGeminiClient(config)
	case database.ProviderOpenAI:
		return NewOpenAIClient(config)
	case database.ProviderClaude:
		return NewClaudeClient(config)
	default:
		return nil, fmt.Errorf("unsupported provider: %s", config.Type)
	}
}
