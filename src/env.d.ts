/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}

// Runtime bindings/secrets available on `locals.runtime.env` in the deployed
// Worker. Keep in sync with wrangler.toml (DB, LEADS_KV) and the Worker's
// runtime secrets (TURNSTILE_SECRET, RESEND_*, LEAD_NOTIFY_EMAIL).
//
// NOTE: the Turnstile *site* key is intentionally absent here. It is the
// build-time `PUBLIC_TURNSTILE_SITE_KEY`, read via `import.meta.env` and
// inlined by Astro at build time — it is never a runtime binding.
interface Env {
  DB?: D1Database;
  LEADS_KV?: KVNamespace;
  TURNSTILE_SECRET?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  LEAD_NOTIFY_EMAIL?: string;
}
