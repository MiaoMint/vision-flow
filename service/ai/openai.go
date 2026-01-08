package ai

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strings"
	"time"

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

	var messages []openai.ChatCompletionMessage

	if len(req.Images) > 0 {
		parts := []openai.ChatMessagePart{
			{
				Type: openai.ChatMessagePartTypeText,
				Text: req.Prompt,
			},
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
			imgURL := fmt.Sprintf("data:%s;base64,%s", mimeType, b64Data)

			parts = append(parts, openai.ChatMessagePart{
				Type: openai.ChatMessagePartTypeImageURL,
				ImageURL: &openai.ChatMessageImageURL{
					URL: imgURL,
				},
			})
		}

		messages = []openai.ChatCompletionMessage{
			{
				Role:         openai.ChatMessageRoleUser,
				MultiContent: parts,
			},
		}
	} else {
		messages = []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleUser,
				Content: req.Prompt,
			},
		}
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

// GenerateVideo generates a video using OpenAI's video generation API (Sora)
func (c *OpenAIClient) GenerateVideo(ctx context.Context, req VideoGenerateRequest) (*VideoGenerateResponse, error) {
	if req.Model == "" {
		req.Model = "sora-2" // Default to a known model if unspecified
	}

	// Use multipart/form-data
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// Add fields
	if err := writer.WriteField("model", req.Model); err != nil {
		return nil, fmt.Errorf("failed to write model field: %w", err)
	}
	if err := writer.WriteField("prompt", req.Prompt); err != nil {
		return nil, fmt.Errorf("failed to write prompt field: %w", err)
	}

	if req.Resolution != "" {
		if err := writer.WriteField("size", req.Resolution); err != nil {
			return nil, fmt.Errorf("failed to write size field: %w", err)
		}
	}

	if req.Duration != "" {
		dur := strings.TrimSuffix(req.Duration, "s")
		if err := writer.WriteField("seconds", dur); err != nil {
			return nil, fmt.Errorf("failed to write seconds field: %w", err)
		}
	}

	// Add input_reference file if exists
	if len(req.Images) > 0 {
		imagePath := req.Images[0]
		data, err := LoadContent(imagePath)
		if err != nil {
			return nil, err
		}

		part, err := writer.CreateFormFile("input_reference", filepath.Base(imagePath))
		if err != nil {
			return nil, fmt.Errorf("failed to create form file: %w", err)
		}
		if _, err := io.Copy(part, bytes.NewReader(data)); err != nil {
			return nil, fmt.Errorf("failed to copy file content: %w", err)
		}
	}

	if err := writer.Close(); err != nil {
		return nil, fmt.Errorf("failed to close multipart writer: %w", err)
	}

	baseURL := "https://api.openai.com/v1"
	if c.config.BaseURL != "" {
		baseURL = c.config.BaseURL
	}

	// 1. Create Video Generation Job
	reqURL := fmt.Sprintf("%s/videos", baseURL)
	httpReq, err := http.NewRequestWithContext(ctx, "POST", reqURL, body)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Authorization", "Bearer "+c.config.APIKey)
	httpReq.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to send video generation request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("video generation request failed with status %d: %s", resp.StatusCode, string(body))
	}

	var jobResp struct {
		ID     string `json:"id"`
		Status string `json:"status"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&jobResp); err != nil {
		return nil, fmt.Errorf("failed to decode job response: %w", err)
	}

	// 2. Poll for Completion
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-ticker.C:
			statusURL := fmt.Sprintf("%s/videos/%s", baseURL, jobResp.ID)
			statusReq, err := http.NewRequestWithContext(ctx, "GET", statusURL, nil)
			if err != nil {
				return nil, fmt.Errorf("failed to create status request: %w", err)
			}
			statusReq.Header.Set("Authorization", "Bearer "+c.config.APIKey)

			statusResp, err := client.Do(statusReq)
			if err != nil {
				return nil, fmt.Errorf("failed to check video status: %w", err)
			}

			var statusObj struct {
				Status string `json:"status"`
				Error  *struct {
					Message string `json:"message"`
				} `json:"error"`
			}

			// Decode and close explicitly inside loop to avoid leak
			body, _ := io.ReadAll(statusResp.Body)
			statusResp.Body.Close()

			if statusResp.StatusCode != http.StatusOK {
				return nil, fmt.Errorf("status check failed: %d %s", statusResp.StatusCode, string(body))
			}

			if err := json.Unmarshal(body, &statusObj); err != nil {
				return nil, fmt.Errorf("failed to decode status response: %w", err)
			}

			switch statusObj.Status {
			case "completed":
				goto Download
			case "failed":
				errMsg := "unknown error"
				if statusObj.Error != nil {
					errMsg = statusObj.Error.Message
				}
				return nil, fmt.Errorf("video generation failed: %s", errMsg)
			}
			// Continue polling if queued or in_progress
		}
	}

Download:
	// 3. Download Content
	contentURL := fmt.Sprintf("%s/videos/%s/content", baseURL, jobResp.ID)
	contentReq, err := http.NewRequestWithContext(ctx, "GET", contentURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create download request: %w", err)
	}
	contentReq.Header.Set("Authorization", "Bearer "+c.config.APIKey)

	contentResp, err := client.Do(contentReq)
	if err != nil {
		return nil, fmt.Errorf("failed to download video content: %w", err)
	}
	defer contentResp.Body.Close()

	if contentResp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("download failed with status %d", contentResp.StatusCode)
	}

	videoData, err := io.ReadAll(contentResp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read video data: %w", err)
	}

	return &VideoGenerateResponse{
		Data:  videoData,
		Model: req.Model,
	}, nil
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
