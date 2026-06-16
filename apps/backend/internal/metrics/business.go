package metrics

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var SignupsTotal = promauto.NewCounter(prometheus.CounterOpts{
	Name: "relay_signups_total",
	Help: "Total number of successful user sign-ups",
})
