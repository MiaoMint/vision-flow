package ai

import (
	"context"
	"errors"
	"fmt"

	"firebringer/database"

	"strings"

	"google.golang.org/genai"
)

// GeminiClient implements the AIClient interface for Google Gemini
type GeminiClient struct {
	client *genai.Client
	config database.ModelProvider
}

// NewGeminiClient creates a new Google Gemini client
func NewGeminiClient(config database.ModelProvider) (*GeminiClient, error) {
	if config.APIKey == "" {
		return nil, errors.New("Google API key is required")
	}

	clientConfig := &genai.ClientConfig{
		APIKey: config.APIKey,
	}
	if config.BaseURL != "" {
		clientConfig.HTTPOptions = genai.HTTPOptions{
			BaseURL: config.BaseURL,
		}
	}

	ctx := context.Background()
	client, err := genai.NewClient(ctx, clientConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create Gemini client: %w", err)
	}

	return &GeminiClient{
		client: client,
		config: config,
	}, nil
}

// GenerateText generates text using Gemini's generate content API
func (c *GeminiClient) GenerateText(ctx context.Context, req TextGenerateRequest) (*TextGenerateResponse, error) {
	if req.Model == "" {
		req.Model = "gemini-2.0-flash-exp"
	}

	// Configure generation options
	genConfig := &genai.GenerateContentConfig{}
	if req.Temperature != nil {
		temp := float32(*req.Temperature)
		genConfig.Temperature = &temp
	}
	if req.MaxTokens != nil {
		genConfig.MaxOutputTokens = int32(*req.MaxTokens)
	}

	// Call the API
	resp, err := c.client.Models.GenerateContent(ctx, req.Model, genai.Text(req.Prompt), genConfig)
	if err != nil {
		return nil, fmt.Errorf("Gemini content generation failed: %w", err)
	}

	// Calculate tokens (if available in response, otherwise 0)
	var promptTokens, outputTokens, totalTokens int
	if resp.UsageMetadata != nil {
		promptTokens = int(resp.UsageMetadata.PromptTokenCount)
		outputTokens = int(resp.UsageMetadata.CandidatesTokenCount)
		totalTokens = int(resp.UsageMetadata.TotalTokenCount)
	}

	// Extract text content
	var content string
	if len(resp.Candidates) > 0 {
		for _, part := range resp.Candidates[0].Content.Parts {
			if part.Text != "" {
				content += part.Text
			}
		}
	} else {
		return nil, errors.New("no response content from Gemini")
	}

	return &TextGenerateResponse{
		Content:      content,
		PromptTokens: promptTokens,
		OutputTokens: outputTokens,
		TotalTokens:  totalTokens,
		Model:        req.Model,
	}, nil
}

// GenerateImage generates an image using Gemini's image generation capabilities
func (c *GeminiClient) GenerateImage(ctx context.Context, req ImageGenerateRequest) (*ImageGenerateResponse, error) {
	if req.Model == "" {
		req.Model = "imagen-3.0-generate-001"
	}

	// Use GenerateContent for image generation
	resp, err := c.client.Models.GenerateContent(ctx, req.Model, genai.Text(req.Prompt), nil)
	if err != nil {
		return nil, fmt.Errorf("Gemini image generation failed: %w", err)
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return nil, errors.New("no image generated from Gemini")
	}

	// Extract image data from response
	for _, part := range resp.Candidates[0].Content.Parts {
		if part.InlineData != nil {
			return &ImageGenerateResponse{
				B64JSON: string(part.InlineData.Data), // Assuming Data is bytes
				Model:   req.Model,
			}, nil
		}
	}

	return nil, errors.New("no image data in Gemini response")
}

// GenerateAudio is not fully supported by Gemini library in the same way yet
func (c *GeminiClient) GenerateAudio(ctx context.Context, req AudioGenerateRequest) (*AudioGenerateResponse, error) {
	return nil, errors.New("audio generation is not fully supported by Gemini yet")
}

// GenerateVideo generates a video using Gemini's video generation capabilities
func (c *GeminiClient) GenerateVideo(ctx context.Context, req VideoGenerateRequest) (*VideoGenerateResponse, error) {
	if req.Model == "" {
		req.Model = "veo-2.0-generate-001" // Example model name
	}

	resp, err := c.client.Models.GenerateContent(ctx, req.Model, genai.Text(req.Prompt), nil)
	if err != nil {
		return nil, fmt.Errorf("Gemini video generation failed: %w", err)
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return nil, errors.New("no video generated from Gemini")
	}

	for _, part := range resp.Candidates[0].Content.Parts {
		if part.InlineData != nil {
			return &VideoGenerateResponse{
				Data:  part.InlineData.Data, // Return raw bytes
				Model: req.Model,
			}, nil
		}
	}

	return nil, errors.New("no video data in Gemini response")
}

// ListModels lists available models from Gemini
func (c *GeminiClient) ListModels(ctx context.Context) ([]Model, error) {
	// List method returns a Page[Model]
	page, err := c.client.Models.List(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to list Gemini models: %w", err)
	}

	var models []Model
	// Assuming Page has items directly or we iterate. The genai library usage:
	// Page usually has Items field
	for _, m := range page.Items {
		cleanID := strings.TrimPrefix(m.Name, "models/")
		input, output := GetModelCapabilities(cleanID)
		if len(input) == 0 {
			// Try with full name just in case
			input, output = GetModelCapabilities(m.Name)
		}

		models = append(models, Model{
			ID:           m.Name, // Or m.DisplayName? Name is usually the resource name "models/..."
			Object:       "model",
			ProviderName: c.config.Name,
			ProviderType: string(c.config.Type),
			Input:        input,
			Output:       output,
		})
	}

	return models, nil
}
