# ---- Build stage ----------------------------------------------------------
FROM golang:1.25-alpine AS build

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

RUN go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@v4.18.1

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/api ./cmd/api

# ---- Runtime stage --------------------------------------------------------
FROM alpine:3.20

RUN apk add --no-cache ca-certificates && adduser -D -u 10001 app
WORKDIR /app

COPY --from=build /out/api /app/api
COPY --from=build /go/bin/migrate /usr/local/bin/migrate
COPY --from=build /src/migrations /app/migrations
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

USER app
EXPOSE 8080

ENTRYPOINT ["/app/entrypoint.sh"]
