import {
  captureFrontendError,
  captureFrontendMessage,
} from "../monitoring/sentry";

type LogLevel = "info" | "warn" | "error";
type LogMeta = Record<string, unknown>;

const appEnv = import.meta.env.VITE_ENV || import.meta.env.MODE;
const isConsoleLoggingEnabled =
  appEnv !== "production" ||
  import.meta.env.VITE_ENABLE_CLIENT_LOGS === "true";

function writeToConsole(
  level: LogLevel,
  scope: string,
  message: string,
  meta?: LogMeta,
): void {
  if (!isConsoleLoggingEnabled) {
    return;
  }

  const payload = meta ? [meta] : [];
  const formattedMessage = `[${scope}] ${message}`;

  if (level === "error") {
    console.error(formattedMessage, ...payload);
    return;
  }

  if (level === "warn") {
    console.warn(formattedMessage, ...payload);
    return;
  }

  console.info(formattedMessage, ...payload);
}

export function createLogger(scope: string) {
  return {
    info(message: string, meta?: LogMeta) {
      writeToConsole("info", scope, message, meta);
      captureFrontendMessage(`[${scope}] ${message}`, "info", meta || {});
    },
    warn(message: string, meta?: LogMeta) {
      writeToConsole("warn", scope, message, meta);
      captureFrontendMessage(`[${scope}] ${message}`, "warning", meta || {});
    },
    error(message: string, error: unknown, meta?: LogMeta) {
      writeToConsole("error", scope, message, {
        ...(meta || {}),
        errorMessage: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof Error) {
        captureFrontendError(error, {
          scope,
          message,
          ...(meta || {}),
        });
        return;
      }

      captureFrontendMessage(`[${scope}] ${message}`, "error", {
        scope,
        rawError: error,
        ...(meta || {}),
      });
    },
  };
}
