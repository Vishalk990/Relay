package pgconv

import (
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// Convert string to pgtypeUUID
func ParseUUID(s string) (pgtype.UUID, error) {
	var u pgtype.UUID
	if err := u.Scan(s); err != nil {
		return u, err
	}
	return u, nil
}

// UUIDString renders a pgtype.UUID as its canonical string ("" if NULL).
func UUIDString(u pgtype.UUID) string {
	if !u.Valid {
		return ""
	}
	return uuid.UUID(u.Bytes).String()
}
