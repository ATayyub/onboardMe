import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
  // Suppress Sentry when DSN is not configured (local dev without a project)
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
