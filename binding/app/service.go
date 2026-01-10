package app

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
)

type Service struct {
	WailsJSON string
}

func NewService(wailsJSON string) *Service {
	return &Service{
		WailsJSON: wailsJSON,
	}
}

func (s *Service) GetWailsJSON() string {
	return s.WailsJSON
}

// UpdateInfo contains information about the available update
type UpdateInfo struct {
	HasUpdate      bool   `json:"hasUpdate"`
	LatestVersion  string `json:"latestVersion"`
	CurrentVersion string `json:"currentVersion"`
	ReleaseURL     string `json:"releaseURL"`
	ReleaseNotes   string `json:"releaseNotes"`
	Error          string `json:"error,omitempty"`
}

// GitHubRelease represents a release from GitHub API
type GitHubRelease struct {
	TagName     string `json:"tag_name"`
	HTMLURL     string `json:"html_url"`
	Name        string `json:"name"`
	Body        string `json:"body"`
	Prerelease  bool   `json:"prerelease"`
	Draft       bool   `json:"draft"`
	PublishedAt string `json:"published_at"`
}

// wailsConfig is used to parse the version from wails.json
type wailsConfig struct {
	Info struct {
		ProductVersion string `json:"productVersion"`
	} `json:"info"`
}

// CheckUpdate checks for available updates on GitHub
func (s *Service) CheckUpdate() UpdateInfo {
	// 1. Get current version
	var config wailsConfig
	if err := json.Unmarshal([]byte(s.WailsJSON), &config); err != nil {
		return UpdateInfo{Error: "Failed to parse current version: " + err.Error()}
	}
	currentVersion := config.Info.ProductVersion
	if currentVersion == "" {
		currentVersion = "0.0.0"
	}

	// 2. Fetch releases from GitHub
	client := &http.Client{}
	req, err := http.NewRequest("GET", "https://api.github.com/repos/MiaoMint/vision-flow/releases", nil)
	if err != nil {
		return UpdateInfo{CurrentVersion: currentVersion, Error: "Failed to create request: " + err.Error()}
	}
	
	// Add User-Agent header which is often required by GitHub API
	req.Header.Set("User-Agent", "VisionFlow-Updater")

	resp, err := client.Do(req)
	if err != nil {
		return UpdateInfo{CurrentVersion: currentVersion, Error: "Failed to fetch releases: " + err.Error()}
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return UpdateInfo{CurrentVersion: currentVersion, Error: fmt.Sprintf("GitHub API returned status: %d", resp.StatusCode)}
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return UpdateInfo{CurrentVersion: currentVersion, Error: "Failed to read response: " + err.Error()}
	}

	var releases []GitHubRelease
	if err := json.Unmarshal(body, &releases); err != nil {
		return UpdateInfo{CurrentVersion: currentVersion, Error: "Failed to parse releases: " + err.Error()}
	}

	if len(releases) == 0 {
		return UpdateInfo{CurrentVersion: currentVersion, HasUpdate: false}
	}

	// Find latest stable release
	var latestRelease GitHubRelease
	found := false
	for _, r := range releases {
		if !r.Draft && !r.Prerelease {
			latestRelease = r
			found = true
			break
		}
	}

	if !found {
		// If no stable release found, check if we are on a pre-release or just return no update
		return UpdateInfo{CurrentVersion: currentVersion, HasUpdate: false}
	}

	// 3. Compare versions
	latestVersionTag := strings.TrimPrefix(latestRelease.TagName, "v")
	
	hasUpdate := compareVersions(latestVersionTag, currentVersion) > 0

	return UpdateInfo{
		HasUpdate:      hasUpdate,
		LatestVersion:  latestVersionTag,
		CurrentVersion: currentVersion,
		ReleaseURL:     latestRelease.HTMLURL,
		ReleaseNotes:   latestRelease.Body,
	}
}

// compareVersions compares two semantic version strings.
// Returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal.
func compareVersions(v1, v2 string) int {
	p1 := strings.Split(v1, ".")
	p2 := strings.Split(v2, ".")

	len1 := len(p1)
	len2 := len(p2)
	maxLen := len1
	if len2 > maxLen {
		maxLen = len2
	}

	for i := 0; i < maxLen; i++ {
		n1 := 0
		if i < len1 {
			n1, _ = strconv.Atoi(p1[i])
		}
		n2 := 0
		if i < len2 {
			n2, _ = strconv.Atoi(p2[i])
		}

		if n1 > n2 {
			return 1
		}
		if n1 < n2 {
			return -1
		}
	}
	return 0
}
