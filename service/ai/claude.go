package ai

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"mime"
	"net/http"
	"path/filepath"

	"firebringer/database"

	"github.com/anthropics/anthropic-sdk-go"
	"github.com/anthropics/anthropic-sdk-go/option"
	"github.com/anthropics/anthropic-sdk-go/packages/param"
)

// ClaudeClient implements the AIClient interface for Anthropic Claude
type ClaudeClient struct {
	client anthropic.Client
	config database.ModelProvider
}

// NewClaudeClient creates a new Anthropic Claude client
func NewClaudeClient(config database.ModelProvider) (*ClaudeClient, error) {
	if config.APIKey == "" {
		return nil, errors.New("Anthropic API key is required")
	}

	opts := []option.RequestOption{
		option.WithAPIKey(config.APIKey),
	}

	if config.BaseURL != "" {
		opts = append(opts, option.WithBaseURL(config.BaseURL))
	}

	client := anthropic.NewClient(opts...)

	return &ClaudeClient{
		client: client,
		config: config,
	}, nil
}

// GenerateText generates text using Claude's messages API
func (c *ClaudeClient) GenerateText(ctx context.Context, req TextGenerateRequest) (*TextGenerateResponse, error) {
	if req.Model == "" {
		req.Model = "claude-3-5-sonnet-20241022"
	}

	maxTokens := int64(4096)
	if req.MaxTokens != nil {
		maxTokens = int64(*req.MaxTokens)
	}

	contentBlocks := []anthropic.ContentBlockParamUnion{
		anthropic.NewTextBlock(req.Prompt),
	}

	for _, imgPath := range req.Images {
		data, err := LoadContent(imgPath)
		if err != nil {
			return nil, err
		}

		ext := filepath.Ext(imgPath)
		mimeType := mime.TypeByExtension(ext)
		if mimeType == "" {
			mimeType = http.DetectContentType(data)
		}

		b64Data := base64.StdEncoding.EncodeToString(data)

		// Map mimeType to expected format string if necessary, generally just mime type works or specific enum
		// The SDK usually takes media_type string and data string.
		contentBlocks = append(contentBlocks, anthropic.NewImageBlockBase64(mimeType, b64Data))
	}

	messageReq := anthropic.MessageNewParams{
		Model:     anthropic.Model(req.Model),
		MaxTokens: maxTokens,
		Messages: []anthropic.MessageParam{
			anthropic.NewUserMessage(contentBlocks...),
		},
	}

	if req.Temperature != nil {
		messageReq.Temperature = param.NewOpt(float64(*req.Temperature))
	}

	resp, err := c.client.Messages.New(ctx, messageReq)
	if err != nil {
		return nil, fmt.Errorf("Claude message generation failed: %w", err)
	}

	if len(resp.Content) == 0 {
		return nil, errors.New("no response from Claude")
	}

	var content string
	for _, block := range resp.Content {
		if string(block.Type) == "text" {
			content += block.Text
		}
	}

	return &TextGenerateResponse{
		Content:      content,
		PromptTokens: int(resp.Usage.InputTokens),
		OutputTokens: int(resp.Usage.OutputTokens),
		TotalTokens:  int(resp.Usage.InputTokens + resp.Usage.OutputTokens),
		Model:        string(resp.Model),
	}, nil
}

// GenerateImage is not supported by Claude
func (c *ClaudeClient) GenerateImage(ctx context.Context, req ImageGenerateRequest) (*ImageGenerateResponse, error) {
	return nil, errors.New("image generation is not supported by Claude")
}

// GenerateAudio is not supported by Claude
func (c *ClaudeClient) GenerateAudio(ctx context.Context, req AudioGenerateRequest) (*AudioGenerateResponse, error) {
	return nil, errors.New("audio generation is not supported by Claude")
}

// GenerateVideo is not supported by Claude
func (c *ClaudeClient) GenerateVideo(ctx context.Context, req VideoGenerateRequest) (*VideoGenerateResponse, error) {
	return nil, errors.New("video generation is not supported by Claude")
}

// ListModels lists available models from Claude
func (c *ClaudeClient) ListModels(ctx context.Context) ([]Model, error) {
	// List returns a Pager, which we can iterate or getting current page.
	// AutoPager is easiest if we want all models.
	pager := c.client.Models.ListAutoPaging(ctx, anthropic.ModelListParams{})

	var models []Model
	for pager.Next() {
		m := pager.Current()
		input, output := GetModelCapabilities(string(m.ID))
		models = append(models, Model{
			ID:           string(m.ID),
			Created:      m.CreatedAt.Unix(),
			Object:       string(m.Type),
			ProviderName: c.config.Name,
			ProviderType: string(c.config.Type),
			Input:        input,
			Output:       output,
		})
	}

	if err := pager.Err(); err != nil {
		return nil, fmt.Errorf("failed to list Claude models: %w", err)
	}

	return models, nil
}
