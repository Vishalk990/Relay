package proxy

import (
	"net"
	"net/http"
	"time"
)

const (
	DefaultTimeout   = 30 * time.Second
	MaxResponseBytes = 10 << 20
)

func NewSafeClient() *http.Client {
	dialer := &net.Dialer{Timeout: DefaultTimeout, KeepAlive: 10 * time.Second, Control: safeControl}
	transport := &http.Transport{
		DialContext:         dialer.DialContext,
		ForceAttemptHTTP2:   true,
		TLSHandshakeTimeout: 10 * time.Second,
		IdleConnTimeout:     90 * time.Second,
	}

	return &http.Client{
		Transport: transport,
		Timeout:   DefaultTimeout,
		CheckRedirect: func(_ *http.Request, via []*http.Request) error {
			if len(via) >= 5 {
				return http.ErrUseLastResponse

			}
			return nil

		},
	}
}
