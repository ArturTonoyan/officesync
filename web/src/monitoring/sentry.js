import * as Sentry from "@sentry/react";

const sentryDsn = process.env.REACT_APP_SENTRY_DSN;
let sentryInitialized = false;

function getSampleRate() {
  const rawValue = process.env.REACT_APP_SENTRY_TRACES_SAMPLE_RATE;
  if (!rawValue) {
    return 0.1;
  }

  const parsed = Number(rawValue);
  if (Number.isNaN(parsed)) {
    return 0.1;
  }

  return parsed;
}

export function initSentry() {
  if (sentryInitialized || !sentryDsn) {
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.REACT_APP_ENV || process.env.NODE_ENV,
    tracesSampleRate: getSampleRate(),
  });

  sentryInitialized = true;
}

export function captureFrontendMessage(message, level = "info", context = {}) {
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

export function captureFrontendError(error, context = {}) {
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
