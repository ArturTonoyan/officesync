import * as Sentry from "@sentry/react";

const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
let sentryInitialized = false;

function getSampleRate(): number {
  const rawValue = import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE;
  if (!rawValue) {
    return 0.1;
  }

  const parsed = Number(rawValue);
  if (Number.isNaN(parsed)) {
    return 0.1;
  }

  return parsed;
}

export function initSentry(): void {
  if (sentryInitialized || !sentryDsn) {
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.VITE_ENV || import.meta.env.MODE,
    tracesSampleRate: getSampleRate(),
  });

  sentryInitialized = true;
}

type SentryLevel = "info" | "warning" | "error";

export function captureFrontendMessage(
  message: string,
  level: SentryLevel = "info",
  context: Record<string, unknown> = {},
): void {
  if (!sentryDsn) {
    return;
  }

  Sentry.withScope((scope) => {
    scope.setLevel(level);
    Object.entries(context).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });
    Sentry.captureMessage(message);
  });
}

export function captureFrontendError(
  error: unknown,
  context: Record<string, unknown> = {},
): void {
  if (!sentryDsn) {
    return;
  }

  Sentry.withScope((scope) => {
    Object.entries(context).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });
    Sentry.captureException(error);
  });
}
