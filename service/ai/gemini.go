package ai

import (
	"context"
	"errors"
	"fmt"

	"visionflow/database"
	"visionflow/service/ai/agent"

	"mime"
	"net/http"
	"path/filepath"
	"strings"
	"time"

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

func (c *GeminiClient) processInputs(images, videos, audios, documents []string) ([]*genai.Part, error) {
	var parts []*genai.Part

	processFile := func(path string, mimePrefix string) error {
		// handle if it is a URL just in case, but prioritize file path as requested
		// The user explicitly said "should be local file path not url"
		// So we assume it is a file path.

		data, err := LoadContent(path)
		if err != nil {
			return err
		}

		ext := filepath.Ext(path)
		mimeType := mime.TypeByExtension(ext)

		if mimeType == "" {
			// Fallback: detect from content
			mimeType = http.DetectContentType(data)
		}

		if mimePrefix != "" && !strings.HasPrefix(mimeType, mimePrefix) {
			return fmt.Errorf("file %s has MIME type %q, expected prefix %q", path, mimeType, mimePrefix)
		}

		parts = append(parts, &genai.Part{
			InlineData: &genai.Blob{
				Data:     data,
				MIMEType: mimeType,
			},
		})
		return nil
	}

	for _, path := range images {
		if err := processFile(path, "image/"); err != nil {
			return nil, err
		}
	}
	for _, path := range videos {
		if err := processFile(path, "video/"); err != nil {
			return nil, err
		}
	}
	for _, path := range audios {
		if err := processFile(path, "audio/"); err != nil {
			return nil, err
		}
	}
	for _, path := range documents {
		if err := processFile(path, "application/pdf"); err != nil {
			return nil, err
		}
	}

	return parts, nil
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

	parts := []*genai.Part{{Text: req.Prompt}}

	multimodalParts, err := c.processInputs(req.Images, req.Videos, req.Audios, req.Documents)
	if err != nil {
		return nil, fmt.Errorf("failed to process multimodal inputs: %w", err)
	}
	parts = append(parts, multimodalParts...)

	contents := []*genai.Content{{Parts: parts}}

	// Call the API
	resp, err := c.client.Models.GenerateContent(ctx, req.Model, contents, genConfig)
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

	parts := []*genai.Part{{Text: req.Prompt}}

	multimodalParts, err := c.processInputs(req.Images, req.Videos, req.Audios, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to process multimodal inputs: %w", err)
	}
	parts = append(parts, multimodalParts...)

	contents := []*genai.Content{{Parts: parts}}

	// Use GenerateContent for image generation
	resp, err := c.client.Models.GenerateContent(ctx, req.Model, contents, nil)
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
				Data:  part.InlineData.Data,
				Model: req.Model,
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
		req.Model = "veo-3.1-generate-preview"
	}

	var referenceImages []*genai.VideoGenerationReferenceImage
	for _, imagePath := range req.Images {
		data, err := LoadContent(imagePath)
		if err != nil {
			return nil, err
		}

		// Detect MIME type
		mimeType := http.DetectContentType(data)

		refImg := &genai.VideoGenerationReferenceImage{
			Image: &genai.Image{
				ImageBytes: data,
				MIMEType:   mimeType,
			},
			ReferenceType: genai.VideoGenerationReferenceTypeAsset,
		}
		referenceImages = append(referenceImages, refImg)
	}

	config := &genai.GenerateVideosConfig{
		ReferenceImages: referenceImages,
	}

	operation, err := c.client.Models.GenerateVideos(ctx, req.Model, req.Prompt, nil, config)
	if err != nil {
		return nil, fmt.Errorf("Gemini video generation initialization failed: %w", err)
	}

	// Poll the operation status until the video is ready.
	for !operation.Done {
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-time.After(5 * time.Second):
			operation, err = c.client.Operations.GetVideosOperation(ctx, operation, nil)
			if err != nil {
				return nil, fmt.Errorf("failed to poll operation status: %w", err)
			}
		}
	}

	if operation.Response == nil || len(operation.Response.GeneratedVideos) == 0 {
		return nil, errors.New("no videos generated in response")
	}

	// Download the generated video.
	video := operation.Response.GeneratedVideos[0]
	if video.Video == nil {
		return nil, errors.New("generated video file info is missing")
	}

	data, err := c.client.Files.Download(ctx, video.Video, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to download video content: %w", err)
	}

	return &VideoGenerateResponse{
		Data:  data,
		Model: req.Model,
	}, nil
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

// CanvasAgent implements the streaming canvas editing for Gemini
func (c *GeminiClient) CanvasAgent(ctx context.Context, req CanvasEditRequest, onEvent func(string, any)) error {
	// Register state update channel for this session
	stateUpdateChan := agent.RegisterChannel(req.SessionID)
	defer agent.UnregisterChannel(req.SessionID)

	return agent.Run(ctx, agent.ExecutionRequest{
		Prompt:  req.Prompt,
		Model:   req.Model,
		History: req.History,
	}, &c.config, "gemini-2.0-flash-exp", onEvent, stateUpdateChan)
}
