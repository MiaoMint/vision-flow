package ai

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"firebringer/storage"
)

//go:embed model_data.json
var modelDataJSON []byte

type ModelCapabilities struct {
	Input  []string `json:"input"`
	Output []string `json:"output"`
}

type ModelInfo struct {
	ID         string `json:"id"`
	Modalities struct {
		Input  []string `json:"input"`
		Output []string `json:"output"`
	} `json:"modalities"`
}

type ProviderInfo struct {
	Models map[string]ModelInfo `json:"models"`
}

var (
	capabilitiesMap   map[string]ModelCapabilities
	capabilitiesMutex sync.RWMutex
	once              sync.Once
)

// InitCapabilities initializes the model capabilities data.
// It writes the embedded data to the config directory and then updates it from the web.
func InitCapabilities() error {
	path, err := storage.GetAppConfigDir()
	if err != nil {
		return err
	}
	modelDataPath := filepath.Join(path, "model_data.json")

	// 1. Write embedded data to file (bootstrap/ensure existence)
	// We do this to ensure we have value in the file system for inspection or fallback,
	// and to "seed" the file as requested.
	_ = os.WriteFile(modelDataPath, modelDataJSON, 0644)

	// 2. Load initial data into memory from the embedded content (guaranteed to be there)
	// Alternatively we could read from file, but embedded is safer for first run.
	loadCapabilitiesFromBytes(modelDataJSON)

	// 3. Background update
	go func() {
		updateModelConfigs(modelDataPath)
	}()

	return nil
}

func updateModelConfigs(filePath string) {
	resp, err := http.Get("https://models.dev/api.json")
	if err != nil {
		fmt.Printf("Failed to fetch model data from models.dev: %v\n", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		fmt.Printf("Failed to fetch model data: status %d\n", resp.StatusCode)
		return
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Printf("Failed to read model data body: %v\n", err)
		return
	}

	// Validate JSON schema roughly by unmarshalling
	var data map[string]ProviderInfo
	if err := json.Unmarshal(body, &data); err != nil {
		fmt.Printf("Invalid model data JSON from remote: %v\n", err)
		return
	}

	// Write updated data to file
	if err := os.WriteFile(filePath, body, 0644); err != nil {
		fmt.Printf("Failed to write updated model data: %v\n", err)
	}

	// Update memory
	loadCapabilitiesFromBytes(body)
}

func loadCapabilitiesFromBytes(dataBytes []byte) {
	capabilitiesMutex.Lock()
	defer capabilitiesMutex.Unlock()

	capabilitiesMap = make(map[string]ModelCapabilities)
	var data map[string]ProviderInfo
	if err := json.Unmarshal(dataBytes, &data); err != nil {
		return
	}

	for _, provider := range data {
		for id, model := range provider.Models {
			// Store by the ID in the JSON (key)
			capabilitiesMap[id] = ModelCapabilities{
				Input:  model.Modalities.Input,
				Output: model.Modalities.Output,
			}
			// Store by the "id" field if different
			if model.ID != "" && model.ID != id {
				capabilitiesMap[model.ID] = ModelCapabilities{
					Input:  model.Modalities.Input,
					Output: model.Modalities.Output,
				}
			}

			// Also index by base name (everything after the last /) to handle namespaces
			if lastSlash := strings.LastIndex(id, "/"); lastSlash != -1 {
				baseName := id[lastSlash+1:]
				if baseName != "" {
					capabilitiesMap[baseName] = ModelCapabilities{
						Input:  model.Modalities.Input,
						Output: model.Modalities.Output,
					}
				}
			}
			if model.ID != "" {
				if lastSlash := strings.LastIndex(model.ID, "/"); lastSlash != -1 {
					baseName := model.ID[lastSlash+1:]
					if baseName != "" && baseName != model.ID {
						capabilitiesMap[baseName] = ModelCapabilities{
							Input:  model.Modalities.Input,
							Output: model.Modalities.Output,
						}
					}
				}
			}
		}
	}
}

// GetModelCapabilities returns the input and output modalities for a given model ID.
// If not found, returns empty slices.
func GetModelCapabilities(modelID string) (input, output []string) {
	// Ensure loaded at least once if InitCapabilities wasn't called (e.g. in tests)
	once.Do(func() {
		if capabilitiesMap == nil {
			loadCapabilitiesFromBytes(modelDataJSON)
		}
	})

	capabilitiesMutex.RLock()
	defer capabilitiesMutex.RUnlock()

	// Exact match
	if caps, ok := capabilitiesMap[modelID]; ok {
		return caps.Input, caps.Output
	}

	// Fallback: try case-insensitive
	for id, caps := range capabilitiesMap {
		if strings.EqualFold(id, modelID) {
			return caps.Input, caps.Output
		}
	}

	return nil, nil
}
