package environments

import (
	"encoding/json"
	"relay-backend/internal/db/sqlc"
	"relay-backend/internal/pgconv"
)

type envInput struct {
	Name      string          `json:"name"`
	Variables json.RawMessage `json:"variables"`
}

type environmentDTO struct {
	ID          string          `json:"id"`
	WorkspaceID string          `json:"workspaceId"`
	Name        string          `json:"name"`
	Variables   json.RawMessage `json:"variables"`
}

func toDTO(e sqlc.Environment) environmentDTO {
	return environmentDTO{
		ID:          pgconv.UUIDString(e.ID),
		WorkspaceID: pgconv.UUIDString(e.WorkspaceID),
		Name:        e.Name,
		Variables:   jsonOrNull(e.Variables),
	}
}

func jsonOrNull(b []byte) json.RawMessage {
	if len(b) == 0 {
		return json.RawMessage("null")
	}
	return json.RawMessage(b)
}
func defaultJSON(m json.RawMessage, def string) []byte {
	if len(m) == 0 {
		return []byte(def)
	}
	return []byte(m)
}
