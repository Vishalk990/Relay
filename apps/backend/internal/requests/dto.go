package requests

import (
	"encoding/json"
	"net/http"
	"relay-backend/internal/db/sqlc"
	"relay-backend/internal/pgconv"
)

var allowedMethods = map[string]bool{
	http.MethodGet: true, http.MethodPost: true, http.MethodPut: true, http.MethodPatch: true,
	http.MethodDelete: true, http.MethodHead: true, http.MethodOptions: true,
}

type header struct {
	Key     string `json:"key"`
	Value   string `json:"value"`
	Enabled bool   `json:"enabled"`
}

type sendRequest struct {
	Method  string   `json:"method"`
	URL     string   `json:"url"`
	Headers []header `json:"headers"`
	Body    string   `json:"body"`
}

type sendResponse struct {
	Status     int               `json:"status"`
	StatusText string            `json:"statusText"`
	DurationMs int64             `json:"durationMs"`
	SizeBytes  int               `json:"sizeBytes"`
	Headers    map[string]string `json:"headers"`
	Body       string            `json:"body"`
}

type saveRequestInput struct {
	Name        string          `json:"name"`
	Description string          `json:"description"`
	Method      string          `json:"method"`
	URL     string          `json:"url"`
	Params  json.RawMessage `json:"params"`
	Headers json.RawMessage `json:"headers"`
	Body    json.RawMessage `json:"body"`
}

type requestDTO struct {
	ID           string          `json:"id"`
	CollectionID string          `json:"collectionId"`
	Name         string          `json:"name"`
	Description  string          `json:"description"`
	Method       string          `json:"method"`
	URL          string          `json:"url"`
	Params       json.RawMessage `json:"params"`
	Headers      json.RawMessage `json:"headers"`
	Body         json.RawMessage `json:"body"`
}

func toDTO(r sqlc.Request) requestDTO {
	return requestDTO{
		ID:           pgconv.UUIDString(r.ID),
		CollectionID: pgconv.UUIDString(r.CollectionID),
		Name:         r.Name,
		Description:  r.Description,
		Method:       r.Method,
		URL:          r.Url,
		Params:       jsonOrNull(r.Params),
		Headers:      jsonOrNull(r.Headers),
		Body:         jsonOrNull(r.Body),
	}
}

func defaultJSON(m json.RawMessage, def string) []byte {
	if len(m) == 0 {
		return []byte(def)
	}
	return []byte(m)
}

func jsonOrNull(b []byte) json.RawMessage {
	if len(b) == 0 {
		return json.RawMessage("null")
	}
	return json.RawMessage(b)
}
