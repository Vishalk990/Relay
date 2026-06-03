package logger

import "go.uber.org/zap"

var globalLogger *zap.Logger

func InitializeBasic() *zap.Logger {
	l, _ := zap.NewProduction()
	globalLogger = l
	return l
}

func ReinitializeWithConfig(env string) *zap.Logger {
	var l *zap.Logger
	if env == "local" || env == "development" {
		l, _ = zap.NewDevelopment()
	} else {
		l, _ = zap.NewProduction()
	}
	globalLogger = l
	return l
}

func Sync() {
	if globalLogger != nil {
		_ = globalLogger.Sync()
	}
}
