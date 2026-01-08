package ai

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
)

// LoadContent retrieves data from a URL or local file path.
// It returns the data bytes and the error if any.
func LoadContent(pathOrURL string) ([]byte, error) {
	if strings.HasPrefix(pathOrURL, "http://") || strings.HasPrefix(pathOrURL, "https://") {
		resp, err := http.Get(pathOrURL)
		if err != nil {
			return nil, fmt.Errorf("failed to fetch URL %s: %w", pathOrURL, err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			return nil, fmt.Errorf("failed to fetch URL %s: status code %d", pathOrURL, resp.StatusCode)
		}

		data, err := io.ReadAll(resp.Body)
		if err != nil {
			return nil, fmt.Errorf("failed to read body from %s: %w", pathOrURL, err)
		}
		return data, nil
	}

	// Fallback to local file read if it doesn't look like a URL
	data, err := os.ReadFile(pathOrURL)
	if err != nil {
		return nil, fmt.Errorf("failed to read local file %s: %w", pathOrURL, err)
	}
	return data, nil
}
