package proxy

import (
	"net"
	"testing"
)

func TestIsBlockedIP(t *testing.T) {
	cases := []struct {
		ip      string
		blocked bool
	}{
		{"127.0.0.1", true}, {"::1", true}, {"10.0.0.5", true}, {"172.16.5.4", true},
		{"192.168.1.1", true}, {"169.254.169.254", true}, {"0.0.0.0", true},
		{"8.8.8.8", false}, {"1.1.1.1", false}, {"93.184.216.34", false},
	}
	for _, tc := range cases {
		if got := isBlockedIP(net.ParseIP(tc.ip)); got != tc.blocked {
			t.Errorf("isBlockedIP(%s) = %v, want %v", tc.ip, got, tc.blocked)
		}
	}
}
