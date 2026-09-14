export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogContext = {
  restaurantId?: string;
  digest?: string;
  [key: string]: unknown;
};

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function minimumLevel(): LogLevel {
  const configured = process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel | undefined;
  if (configured && configured in LEVEL_ORDER) return configured;
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

function serialiseError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error.cause ? { cause: String(error.cause) } : {}),
    };
  }
  return { message: String(error) };
}

function emit(level: LogLevel, event: string, context: LogContext, error?: unknown): void {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[minimumLevel()]) return;

  const line = {
    level,
    event,
    time: new Date().toISOString(),
    ...context,
    ...(error !== undefined ? { error: serialiseError(error) } : {}),
  };

  const serialised = JSON.stringify(line);
  if (level === "error") console.error(serialised);
  else if (level === "warn") console.warn(serialised);
  else console.log(serialised);
}

export const logger = {
  debug: (event: string, context: LogContext = {}) => emit("debug", event, context),
  info: (event: string, context: LogContext = {}) => emit("info", event, context),
  warn: (event: string, context: LogContext = {}) => emit("warn", event, context),
  error: (event: string, error: unknown, context: LogContext = {}) =>
    emit("error", event, context, error),
};
