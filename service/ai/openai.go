package ai

import (
	"context"
	"errors"
	"fmt"
	"io"

	"firebringer/database"

	"github.com/sashabaranov/go-openai"
)

// OpenAIClient implements the AIClient interface for OpenAI
type OpenAIClient struct {
	client *openai.Client
	config database.ModelProvider
}

// NewOpenAIClient creates a new OpenAI client
func NewOpenAIClient(config database.ModelProvider) (*OpenAIClient, error) {
	if config.APIKey == "" {
		return nil, errors.New("OpenAI API key is required")
	}

	clientConfig := openai.DefaultConfig(config.APIKey)
	if config.BaseURL != "" {
		clientConfig.BaseURL = config.BaseURL
	}

	return &OpenAIClient{
		client: openai.NewClientWithConfig(clientConfig),
		config: config,
	}, nil
}

// GenerateText generates text using OpenAI's chat completion API
func (c *OpenAIClient) GenerateText(ctx context.Context, req TextGenerateRequest) (*TextGenerateResponse, error) {
	if req.Model == "" {
		req.Model = openai.GPT4o
	}

	messages := []openai.ChatCompletionMessage{
		{
			Role:    openai.ChatMessageRoleUser,
			Content: req.Prompt,
		},
	}

	chatReq := openai.ChatCompletionRequest{
		Model:    req.Model,
		Messages: messages,
	}

	if req.Temperature != nil {
		chatReq.Temperature = float32(*req.Temperature)
	}

	if req.MaxTokens != nil {
		chatReq.MaxTokens = *req.MaxTokens
	}

	resp, err := c.client.CreateChatCompletion(ctx, chatReq)
	if err != nil {
		return nil, fmt.Errorf("OpenAI chat completion failed: %w", err)
	}

	if len(resp.Choices) == 0 {
		return nil, errors.New("no response from OpenAI")
	}

	return &TextGenerateResponse{
		Content:      resp.Choices[0].Message.Content,
		PromptTokens: resp.Usage.PromptTokens,
		OutputTokens: resp.Usage.CompletionTokens,
		TotalTokens:  resp.Usage.TotalTokens,
		Model:        resp.Model,
	}, nil
}

// GenerateImage generates an image using OpenAI's DALL-E API
func (c *OpenAIClient) GenerateImage(ctx context.Context, req ImageGenerateRequest) (*ImageGenerateResponse, error) {
	if req.Model == "" {
		req.Model = openai.CreateImageModelDallE3
	}

	imageReq := openai.ImageRequest{
		Prompt: req.Prompt,
		Model:  req.Model,
		N:      1,
	}

	if req.Size != "" {
		imageReq.Size = req.Size
	} else {
		imageReq.Size = openai.CreateImageSize1024x1024
	}

	if req.Quality != "" {
		imageReq.Quality = req.Quality
	}

	if req.Style != "" {
		imageReq.Style = req.Style
	}

	// Default to b64_json for easiest handling in frontend
	imageReq.ResponseFormat = openai.CreateImageResponseFormatB64JSON

	resp, err := c.client.CreateImage(ctx, imageReq)
	if err != nil {
		return nil, fmt.Errorf("OpenAI image generation failed: %w", err)
	}

	if len(resp.Data) == 0 {
		return nil, errors.New("no image generated from OpenAI")
	}

	return &ImageGenerateResponse{
		URL:           resp.Data[0].URL,
		B64JSON:       resp.Data[0].B64JSON,
		RevisedPrompt: resp.Data[0].RevisedPrompt,
		Model:         req.Model, // API doesn't return model in response struct usually
	}, nil
}

// GenerateAudio generates audio using OpenAI's TTS API
func (c *OpenAIClient) GenerateAudio(ctx context.Context, req AudioGenerateRequest) (*AudioGenerateResponse, error) {
	if req.Model == "" {
		req.Model = string(openai.TTSModel1)
	}

	voice := openai.VoiceAlloy
	if req.Voice != "" {
		voice = openai.SpeechVoice(req.Voice)
	}

	audioReq := openai.CreateSpeechRequest{
		Model: openai.SpeechModel(req.Model),
		Input: req.Prompt,
		Voice: voice,
	}

	if req.Speed != nil {
		audioReq.Speed = *req.Speed
	}

	resp, err := c.client.CreateSpeech(ctx, audioReq)
	if err != nil {
		return nil, fmt.Errorf("OpenAI audio generation failed: %w", err)
	}
	defer resp.Close()

	data, err := io.ReadAll(resp)
	if err != nil {
		return nil, fmt.Errorf("failed to read audio data: %w", err)
	}

	return &AudioGenerateResponse{
		Data:  data,
		Model: req.Model,
	}, nil
}

// GenerateVideo is not supported by OpenAI
func (c *OpenAIClient) GenerateVideo(ctx context.Context, req VideoGenerateRequest) (*VideoGenerateResponse, error) {
	return nil, errors.New("video generation is not supported by OpenAI")
}

// ListModels lists available models from OpenAI
func (c *OpenAIClient) ListModels(ctx context.Context) ([]Model, error) {
	list, err := c.client.ListModels(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list OpenAI models: %w", err)
	}

	var models []Model
	for _, m := range list.Models {
		input, output := GetModelCapabilities(m.ID)
		models = append(models, Model{
			ID:           m.ID,
			Owner:        m.OwnedBy,
			Created:      m.CreatedAt,
			Object:       m.Object,
			ProviderName: c.config.Name,
			ProviderType: string(c.config.Type),
			Input:        input,
			Output:       output,
		})
	}

	return models, nil
}
