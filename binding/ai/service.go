package ai

import (
	"context"
	"fmt"

	"firebringer/database"
	aiservice "firebringer/service/ai"
)

// Service provides AI methods for the frontend
type Service struct {
	ctx context.Context
}

// NewService creates a new AI Service
func NewService() *Service {
	return &Service{}
}

// SetContext sets the context for the service
func (s *Service) SetContext(ctx context.Context) {
	s.ctx = ctx
}

// TextRequest defines the parameters for text generation
type TextRequest struct {
	Prompt      string                 `json:"prompt"`
	Model       string                 `json:"model"`
	ProviderID  int                    `json:"providerId"`
	Temperature *float64               `json:"temperature,omitempty"`
	MaxTokens   *int                   `json:"maxTokens,omitempty"`
	Options     map[string]interface{} `json:"options,omitempty"`
}

// ImageRequest defines the parameters for image generation
type ImageRequest struct {
	Prompt     string                 `json:"prompt"`
	Model      string                 `json:"model"`
	ProviderID int                    `json:"providerId"`
	Size       string                 `json:"size,omitempty"`
	Quality    string                 `json:"quality,omitempty"`
	Style      string                 `json:"style,omitempty"`
	Options    map[string]interface{} `json:"options,omitempty"`
}

// VideoRequest defines the parameters for video generation
type VideoRequest struct {
	Prompt     string                 `json:"prompt"`
	Model      string                 `json:"model"`
	ProviderID int                    `json:"providerId"`
	Duration   string                 `json:"duration,omitempty"`
	Resolution string                 `json:"resolution,omitempty"`
	Options    map[string]interface{} `json:"options,omitempty"`
}

// AudioRequest defines the parameters for audio generation
type AudioRequest struct {
	Prompt     string                 `json:"prompt"`
	Model      string                 `json:"model"`
	ProviderID int                    `json:"providerId"`
	Voice      string                 `json:"voice,omitempty"`
	Speed      *float64               `json:"speed,omitempty"`
	Options    map[string]interface{} `json:"options,omitempty"`
}

// AIResponse defines the common response structure for AI requests
type AIResponse struct {
	Content string                 `json:"content"`
	Usage   map[string]interface{} `json:"usage,omitempty"`
	Raw     interface{}            `json:"raw,omitempty"`
}

func (s *Service) getClient(providerID int) (aiservice.AIClient, error) {
	config, err := database.GetModelProvider(providerID)
	if err != nil {
		return nil, fmt.Errorf("failed to get config for provider id %d: %w", providerID, err)
	}
	if config == nil {
		return nil, fmt.Errorf("no configuration found for provider id %d. Please configure it in settings", providerID)
	}

	return aiservice.NewClient(*config)
}

// GenerateText generates text based on the prompt
func (s *Service) GenerateText(req TextRequest) (*AIResponse, error) {
	client, err := s.getClient(req.ProviderID)
	if err != nil {
		return nil, err
	}

	aiReq := aiservice.TextGenerateRequest{
		Prompt:      req.Prompt,
		Model:       req.Model,
		Temperature: req.Temperature,
		MaxTokens:   req.MaxTokens,
		Options:     req.Options,
	}

	resp, err := client.GenerateText(s.ctx, aiReq)
	if err != nil {
		return nil, err
	}

	return &AIResponse{
		Content: resp.Content,
		Usage: map[string]interface{}{
			"promptTokens": resp.PromptTokens,
			"outputTokens": resp.OutputTokens,
			"totalTokens":  resp.TotalTokens,
		},
		Raw: resp,
	}, nil
}

// GenerateImage generates an image based on the prompt
func (s *Service) GenerateImage(req ImageRequest) (*AIResponse, error) {
	client, err := s.getClient(req.ProviderID)
	if err != nil {
		return nil, err
	}

	aiReq := aiservice.ImageGenerateRequest{
		Prompt:  req.Prompt,
		Model:   req.Model,
		Size:    req.Size,
		Quality: req.Quality,
		Style:   req.Style,
		Options: req.Options,
	}

	resp, err := client.GenerateImage(s.ctx, aiReq)
	if err != nil {
		return nil, err
	}

	content := resp.URL
	if content == "" {
		content = resp.B64JSON
	}

	return &AIResponse{
		Content: content,
		Raw:     resp,
	}, nil
}

// GenerateVideo generates a video based on the prompt
func (s *Service) GenerateVideo(req VideoRequest) (*AIResponse, error) {
	client, err := s.getClient(req.ProviderID)
	if err != nil {
		return nil, err
	}

	aiReq := aiservice.VideoGenerateRequest{
		Prompt:     req.Prompt,
		Model:      req.Model,
		Duration:   req.Duration,
		Resolution: req.Resolution,
		Options:    req.Options,
	}

	resp, err := client.GenerateVideo(s.ctx, aiReq)
	if err != nil {
		return nil, err
	}

	content := resp.URL
	if content == "" && len(resp.Data) > 0 {
		content = "Video data (base64 or bytes)" // Improve this for frontend to handle bytes
		// potentially convert bytes to base64 if it is bytes
	}

	return &AIResponse{
		Content: content,
		Raw:     resp,
	}, nil
}

// GenerateAudio generates audio based on the prompt
func (s *Service) GenerateAudio(req AudioRequest) (*AIResponse, error) {
	client, err := s.getClient(req.ProviderID)
	if err != nil {
		return nil, err
	}

	aiReq := aiservice.AudioGenerateRequest{
		Prompt:  req.Prompt,
		Model:   req.Model,
		Voice:   req.Voice,
		Speed:   req.Speed,
		Options: req.Options,
	}

	resp, err := client.GenerateAudio(s.ctx, aiReq)
	if err != nil {
		return nil, err
	}

	// Usually audio is returned as bytes.
	// We might want to base64 encode it for the frontend or return a Blob URL if we could.
	// For now, let's assume valid JSON marshalling or handle it in specific response type
	content := ""
	if len(resp.Data) > 0 {
		// Simple indicator, actual data in Raw or handled by frontend from specific field?
		// Actually AIResponse.Raw is interface{}, so it will marshal the []byte as base64 string automatically in JSON.
		content = "Audio generated"
	}

	return &AIResponse{
		Content: content,
		Raw:     resp,
	}, nil
}

// ListModels lists available models for a given provider ID. If providerId is nil, lists from all providers.
func (s *Service) ListModels(providerId *int) ([]aiservice.Model, error) {
	if providerId == nil {
		configs, err := database.ListModelProviders()
		if err != nil {
			return nil, fmt.Errorf("failed to list providers: %w", err)
		}

		var allModels []aiservice.Model
		for _, config := range configs {
			client, err := aiservice.NewClient(config)
			if err != nil {
				fmt.Printf("failed to create client for %s: %v\n", config.Name, err)
				continue
			}
			models, err := client.ListModels(s.ctx)
			if err != nil {
				fmt.Printf("failed to list models for %s: %v\n", config.Name, err)
				continue
			}
			allModels = append(allModels, models...)
		}
		return allModels, nil
	}

	config, err := database.GetModelProvider(*providerId)
	if err != nil {
		return nil, fmt.Errorf("failed to get config for provider id %d: %w", *providerId, err)
	}
	if config == nil {
		return nil, fmt.Errorf("no configuration found for provider id %d", *providerId)
	}

	client, err := aiservice.NewClient(*config)
	if err != nil {
		return nil, fmt.Errorf("failed to create client for provider id %d: %w", *providerId, err)
	}

	return client.ListModels(s.ctx)
}
