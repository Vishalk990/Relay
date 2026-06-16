package logger

import "go.uber.org/zap"

var globalLogger *zap.Logger

func InitializeBasic() *zap.Logger {
	l, err := zap.NewProduction()
	if err != nil {
		panic(err)
	}
	globalLogger = l
	return l
}

func ReInitializeWithConfig(arg string) *zap.Logger {
	var l *zap.Logger
	if arg == "local" || arg == "development" {
		l, _ = zap.NewDevelopment()
	} else {
		l, _ = zap.NewProduction()
	}
	globalLogger = l
	return l
}

func Sync() {
	if globalLogger == nil {
		_ = globalLogger.Sync()
	}
}
