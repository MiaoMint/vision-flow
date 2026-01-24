package ai

import (
	"context"
	"fmt"
	"time"

	bindingApp "visionflow/binding/app"
	"visionflow/database"
	aiservice "visionflow/service/ai"
	"visionflow/service/ai/agent"
	"visionflow/service/fileserver"
	"visionflow/storage"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// Service provides AI methods for the frontend
type Service struct{}

// NewService creates a new AI Service
func NewService() *Service {
	return &Service{}
}

// TextRequest defines the parameters for text generation
type TextRequest struct {
	Prompt      string         `json:"prompt"`
	Images      []string       `json:"images,omitempty"`
	Videos      []string       `json:"videos,omitempty"`
	Audios      []string       `json:"audios,omitempty"`
	Documents   []string       `json:"documents,omitempty"`
	Model       string         `json:"model"`
	ProviderID  int            `json:"providerId"`
	Temperature *float64       `json:"temperature,omitempty"`
	MaxTokens   *int           `json:"maxTokens,omitempty"`
	Options     map[string]any `json:"options,omitempty"`
}

// ImageRequest defines the parameters for image generation
type ImageRequest struct {
	ProjectID  int            `json:"projectId,omitempty"`
	Prompt     string         `json:"prompt"`
	Images     []string       `json:"images,omitempty"`
	Videos     []string       `json:"videos,omitempty"`
	Audios     []string       `json:"audios,omitempty"`
	Model      string         `json:"model"`
	ProviderID int            `json:"providerId"`
	Size       string         `json:"size,omitempty"`
	Quality    string         `json:"quality,omitempty"`
	Style      string         `json:"style,omitempty"`
	Options    map[string]any `json:"options,omitempty"`
}

// VideoRequest defines the parameters for video generation
type VideoRequest struct {
	ProjectID  int            `json:"projectId,omitempty"`
	Prompt     string         `json:"prompt"`
	Images     []string       `json:"images,omitempty"`
	Videos     []string       `json:"videos,omitempty"`
	Audios     []string       `json:"audios,omitempty"`
	Model      string         `json:"model"`
	ProviderID int            `json:"providerId"`
	Duration   string         `json:"duration,omitempty"`
	Resolution string         `json:"resolution,omitempty"`
	Options    map[string]any `json:"options,omitempty"`
}

// AudioRequest defines the parameters for audio generation
type AudioRequest struct {
	ProjectID  int            `json:"projectId,omitempty"`
	Prompt     string         `json:"prompt"`
	Images     []string       `json:"images,omitempty"`
	Videos     []string       `json:"videos,omitempty"`
	Audios     []string       `json:"audios,omitempty"`
	Model      string         `json:"model"`
	ProviderID int            `json:"providerId"`
	Voice      string         `json:"voice,omitempty"`
	Speed      *float64       `json:"speed,omitempty"`
	Options    map[string]any `json:"options,omitempty"`
}

// AIResponse defines the common response structure for AI requests
type AIResponse struct {
	Content string         `json:"content"`
	Usage   map[string]any `json:"usage,omitempty"`
	Raw     any            `json:"raw,omitempty"`
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
	ctx := context.Background()
	client, err := s.getClient(req.ProviderID)
	if err != nil {
		return nil, err
	}

	aiReq := aiservice.TextGenerateRequest{
		Prompt:      req.Prompt,
		Images:      req.Images,
		Videos:      req.Videos,
		Audios:      req.Audios,
		Documents:   req.Documents,
		Model:       req.Model,
		Temperature: req.Temperature,
		MaxTokens:   req.MaxTokens,
		Options:     req.Options,
	}

	resp, err := client.GenerateText(ctx, aiReq)
	if err != nil {
		return nil, err
	}

	return &AIResponse{
		Content: resp.Content,
		Usage: map[string]any{
			"promptTokens": resp.PromptTokens,
			"outputTokens": resp.OutputTokens,
			"totalTokens":  resp.TotalTokens,
		},
		Raw: resp,
	}, nil
}

// GenerateImage generates an image based on the prompt
func (s *Service) GenerateImage(req ImageRequest) (*AIResponse, error) {
	ctx := context.Background()
	client, err := s.getClient(req.ProviderID)
	if err != nil {
		return nil, err
	}

	aiReq := aiservice.ImageGenerateRequest{
		Prompt:  req.Prompt,
		Images:  req.Images,
		Videos:  req.Videos,
		Audios:  req.Audios,
		Model:   req.Model,
		Size:    req.Size,
		Quality: req.Quality,
		Style:   req.Style,
		Options: req.Options,
	}

	resp, err := client.GenerateImage(ctx, aiReq)
	if err != nil {
		return nil, err
	}

	content, err := s.processContent(req.ProjectID, resp.Data, resp.B64JSON, resp.URL, "image", ".png", database.AssetTypeImage)
	if err != nil {
		return nil, err
	}

	return &AIResponse{
		Content: content,
		Raw:     resp,
	}, nil
}

// GenerateVideo generates a video based on the prompt
func (s *Service) GenerateVideo(req VideoRequest) (*AIResponse, error) {
	ctx := context.Background()
	client, err := s.getClient(req.ProviderID)
	if err != nil {
		return nil, err
	}

	aiReq := aiservice.VideoGenerateRequest{
		Prompt:     req.Prompt,
		Images:     req.Images,
		Videos:     req.Videos,
		Audios:     req.Audios,
		Model:      req.Model,
		Duration:   req.Duration,
		Resolution: req.Resolution,
		Options:    req.Options,
	}

	resp, err := client.GenerateVideo(ctx, aiReq)
	if err != nil {
		return nil, err
	}

	content, err := s.processContent(req.ProjectID, resp.Data, "", resp.URL, "video", ".mp4", database.AssetTypeVideo)
	if err != nil {
		return nil, err
	}

	return &AIResponse{
		Content: content,
		Raw:     resp,
	}, nil
}

// GenerateAudio generates audio based on the prompt
func (s *Service) GenerateAudio(req AudioRequest) (*AIResponse, error) {
	ctx := context.Background()
	client, err := s.getClient(req.ProviderID)
	if err != nil {
		return nil, err
	}

	aiReq := aiservice.AudioGenerateRequest{
		Prompt:  req.Prompt,
		Images:  req.Images,
		Videos:  req.Videos,
		Audios:  req.Audios,
		Model:   req.Model,
		Voice:   req.Voice,
		Speed:   req.Speed,
		Options: req.Options,
	}

	resp, err := client.GenerateAudio(ctx, aiReq)
	if err != nil {
		return nil, err
	}

	// Usually audio is returned as bytes.
	// We might want to base64 encode it for the frontend or return a Blob URL if we could.
	// For now, let's assume valid JSON marshalling or handle it in specific response type
	content, err := s.processContent(req.ProjectID, resp.Data, "", "", "audio", ".mp3", database.AssetTypeAudio)
	if err != nil {
		return nil, err
	}

	return &AIResponse{
		Content: content,
		Raw:     resp,
	}, nil
}

// ListModels lists available models for a given provider ID. If providerId is nil, lists from all providers.
func (s *Service) ListModels(providerId *int) ([]aiservice.Model, error) {
	ctx := context.Background()
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
			models, err := client.ListModels(ctx)
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

	return client.ListModels(ctx)
}

func (s *Service) processContent(projectID int, data []byte, b64 string, url string, prefix string, ext string, assetType database.AssetType) (string, error) {
	var filename string
	var err error

	if len(data) > 0 {
		filename, err = storage.SaveAssetContent(data, prefix, ext)
	} else if b64 != "" {
		filename, err = storage.SaveBase64Content(b64, prefix, ext)
	} else if url != "" {
		filename, err = storage.SaveURLContent(url, prefix, ext)
	} else {
		return "", nil
	}

	if err != nil {
		return "", fmt.Errorf("failed to save %s: %w", prefix, err)
	}

	// Create asset in database if projectID is provided
	if projectID > 0 {
		_, err = database.CreateAsset(database.Asset{
			ProjectID: projectID,
			Type:      assetType,
			Path:      filename,
		})
		if err != nil {
			// Log error but don't fail the request (or maybe we should?)
			// For now, let's log to console and move on, or return error?
			// Better to log and continue, or return error if strict.
			// Let's print for now as we don't have a logger struct here.
			fmt.Printf("failed to create asset for project %d: %v\n", projectID, err)
		}
	}

	return fileserver.GetFileUrl(filename), nil
}

// CanvasAgentRequest defines the parameters for streaming canvas editing
type CanvasAgentRequest struct {
	Prompt     string              `json:"prompt"`
	Model      string              `json:"model"`
	ProviderID int                 `json:"providerId"`
	History    []map[string]string `json:"history,omitempty"`
}

// CanvasAgent initiates a streaming canvas editing session
func (s *Service) CanvasAgent(req CanvasAgentRequest) error {
	ctx := context.Background()
	client, err := s.getClient(req.ProviderID)
	if err != nil {
		return err
	}

	// Generate session ID on backend
	sessionID := fmt.Sprintf("session-%d", time.Now().UnixNano())

	aiReq := aiservice.CanvasEditRequest{
		SessionID: sessionID,
		Prompt:    req.Prompt,
		Model:     req.Model,
		History:   req.History,
	}

	// We need access to Wails context to emit events
	if bindingApp.WailsContext == nil {
		return fmt.Errorf("app context is not initialized")
	}

	// Send session ID to frontend immediately
	runtime.EventsEmit(*bindingApp.WailsContext, "ai:stream:session", sessionID)

	go func() {
		err := client.CanvasAgent(ctx, aiReq, func(eventType string, data any) {
			runtime.EventsEmit(*bindingApp.WailsContext, "ai:stream:"+eventType, data)
		})

		if err != nil {
			runtime.EventsEmit(*bindingApp.WailsContext, "ai:stream:error", err.Error())
		} else {
			runtime.EventsEmit(*bindingApp.WailsContext, "ai:stream:done", nil)
		}
	}()

	return nil
}

// UpdateCanvasState updates the canvas state for an active agent session
func (s *Service) UpdateCanvasState(sessionID string, nodes []map[string]any, edges []map[string]any) error {
	success := agent.SendStateUpdate(sessionID, agent.StateUpdate{
		Nodes: nodes,
		Edges: edges,
	})

	if !success {
		return fmt.Errorf("failed to send state update: session not found or channel full")
	}

	return nil
}
