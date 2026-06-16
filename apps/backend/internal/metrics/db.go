package metrics

import (
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	dbConnsTotal = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "relay_db_pool_conns_total",
		Help: "Total connections currently in the pgx pool",
	})

	dbConnsIdle = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "relay_db_pool_conns_idle",
		Help: "Idle (available) connections in the pgx pool",
	})
	dbConnsInUse = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "relay_db_pool_conns_in_use",
		Help: "Connections currently checked out / in use.",
	})
)

func RecordDBPoolStats(pool *pgxpool.Pool) {
	go func() {
		ticker := time.NewTicker(5 * time.Second)
		defer ticker.Stop()
		for range ticker.C {
			s := pool.Stat()
			dbConnsTotal.Set(float64(s.TotalConns()))
			dbConnsIdle.Set(float64(s.IdleConns()))
			dbConnsInUse.Set(float64(s.AcquiredConns()))
		}
	}()
}
