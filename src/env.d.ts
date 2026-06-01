/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}

interface Env {
  // Bindings — keep in sync with wrangler.toml
  DB?: D1Database;
  LEADS_KV?: KVNamespace;
  TURNSTILE_SECRET?: string;
  TURNSTILE_SITE_KEY?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  LEAD_NOTIFY_EMAIL?: string;
}
