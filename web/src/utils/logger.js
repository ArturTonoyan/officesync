import {
  captureFrontendError,
  captureFrontendMessage,
} from "../monitoring/sentry";

const appEnv = process.env.REACT_APP_ENV || process.env.NODE_ENV;
const isConsoleLoggingEnabled =
  appEnv !== "production" ||
  process.env.REACT_APP_ENABLE_CLIENT_LOGS === "true";

function writeToConsole(level, scope, message, meta) {
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

export function createLogger(scope) {
  return {
    info(message, meta) {
      writeToConsole("info", scope, message, meta);
      captureFrontendMessage(`[${scope}] ${message}`, "info", meta || {});
    },
    warn(message, meta) {
      writeToConsole("warn", scope, message, meta);
      captureFrontendMessage(`[${scope}] ${message}`, "warning", meta || {});
    },
    error(message, error, meta) {
      writeToConsole("error", scope, message, {
        ...(meta || {}),
        errorMessage: error?.message,
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
