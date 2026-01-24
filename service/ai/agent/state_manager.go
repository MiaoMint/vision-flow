package agent

import (
	"sync"
)

// StateChannelManager manages state update channels for active agent sessions
type StateChannelManager struct {
	channels map[string]chan StateUpdate
	mu       sync.RWMutex
}

var globalStateManager = &StateChannelManager{
	channels: make(map[string]chan StateUpdate),
}

// RegisterChannel registers a new state update channel for a session
func RegisterChannel(sessionID string) chan StateUpdate {
	ch := make(chan StateUpdate, 1)
	globalStateManager.mu.Lock()
	globalStateManager.channels[sessionID] = ch
	globalStateManager.mu.Unlock()
	return ch
}

// UnregisterChannel removes a state update channel
func UnregisterChannel(sessionID string) {
	globalStateManager.mu.Lock()
	if ch, exists := globalStateManager.channels[sessionID]; exists {
		close(ch)
		delete(globalStateManager.channels, sessionID)
	}
	globalStateManager.mu.Unlock()
}

// SendStateUpdate sends a state update to a specific session
func SendStateUpdate(sessionID string, update StateUpdate) bool {
	globalStateManager.mu.RLock()
	ch, exists := globalStateManager.channels[sessionID]
	globalStateManager.mu.RUnlock()

	if !exists {
		return false
	}

	select {
	case ch <- update:
		return true
	default:
		// Channel full, skip
		return false
	}
}
