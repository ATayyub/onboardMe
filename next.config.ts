import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {};

export default withSentryConfig(nextConfig, {
  // Suppress Sentry build-time output unless SENTRY_ORG/PROJECT are set
  silent: !process.env.SENTRY_ORG,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Only upload source maps when SENTRY_AUTH_TOKEN is available (CI/Vercel)
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Don't fail the build if Sentry upload fails
  errorHandler: (err: Error) => {
    console.warn("Sentry build warning:", err.message);
  },
});
