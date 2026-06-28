-- Migration: add allowedDomains to organisations
-- Stores a JSON array of allowed CORS origins per org.
-- Empty array ("[]") = allow any origin (backward-compatible default).

ALTER TABLE "organisations" ADD COLUMN "allowedDomains" TEXT NOT NULL DEFAULT '[]';
