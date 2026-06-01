import type { APIRoute } from "astro";

/**
 * Lead capture endpoint, deployed as a Cloudflare Pages Function via the
 * @astrojs/cloudflare adapter. Validates a Turnstile token (if configured),
 * persists the lead to D1 or KV (if bound), and emails a notification via
 * Resend (if configured).
 *
 * Until those bindings are set, the route logs the lead and returns 200
 * so local development and previews still work end-to-end.
 *
 * Env vars (set in Pages dashboard → Settings → Environment variables):
 *   TURNSTILE_SECRET     — server secret for Cloudflare Turnstile.
 *   RESEND_API_KEY       — Resend API key for transactional email.
 *   RESEND_FROM_EMAIL    — verified sender, e.g. hello@thestencilmaker.com.
 *   LEAD_NOTIFY_EMAIL    — where new-lead notifications go.
 *
 * Bindings (configured in wrangler.toml or Pages dashboard):
 *   DB        — D1 database with a `leads` table (see DEPLOY-CLOUDFLARE.md).
 *   LEADS_KV  — KV namespace fallback if D1 isn't bound.
 */

export const prerender = false;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LeadPayload = {
  email?: string;
  source?: string;
  referrer?: string | null;
  turnstileToken?: string | null;
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

async function verifyTurnstile(
  token: string | null | undefined,
  secret: string | undefined,
  ip: string | null,
): Promise<boolean> {
  if (!secret) return true; // Not configured yet — skip in dev/preview.
  if (!token) return false;

  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: form },
    );
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  const env = locals.runtime?.env;

  let body: LeadPayload;
  try {
    body = (await request.json()) as LeadPayload;
  } catch {
    return jsonResponse({ error: "Invalid JSON body." }, 400);
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return jsonResponse({ error: "Please enter a valid email." }, 400);
  }

  const ip =
    request.headers.get("CF-Connecting-IP") ??
    request.headers.get("x-forwarded-for") ??
    clientAddress ??
    null;

  const turnstileOk = await verifyTurnstile(
    body.turnstileToken,
    env?.TURNSTILE_SECRET,
    ip,
  );
  if (!turnstileOk) {
    return jsonResponse({ error: "Anti-bot check failed." }, 400);
  }

  const lead = {
    email,
    source: body.source ?? "/",
    referrer: body.referrer ?? null,
    ip,
    userAgent: request.headers.get("user-agent") ?? null,
    createdAt: new Date().toISOString(),
  };

  // Persist — D1 preferred, KV as fallback, console.log as last resort.
  try {
    if (env?.DB) {
      await env.DB.prepare(
        `INSERT OR IGNORE INTO leads (email, source, referrer, ip, user_agent, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          lead.email,
          lead.source,
          lead.referrer,
          lead.ip,
          lead.userAgent,
          lead.createdAt,
        )
        .run();
    } else if (env?.LEADS_KV) {
      await env.LEADS_KV.put(
        `lead:${lead.createdAt}:${lead.email}`,
        JSON.stringify(lead),
      );
    } else {
      console.log("[lead] (no storage bound; dev mode)", lead);
    }
  } catch (err) {
    console.error("[lead] persist failed", err);
    return jsonResponse({ error: "Couldn't save your email — try again." }, 500);
  }

  // Notification email (best-effort; never block the response on it).
  if (env?.RESEND_API_KEY && env?.RESEND_FROM_EMAIL && env?.LEAD_NOTIFY_EMAIL) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          authorization: `Bearer ${env.RESEND_API_KEY}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          from: env.RESEND_FROM_EMAIL,
          to: [env.LEAD_NOTIFY_EMAIL],
          subject: `New StencilMaker lead — ${lead.email}`,
          text: [
            `Email:    ${lead.email}`,
            `Source:   ${lead.source}`,
            `Referrer: ${lead.referrer ?? "(direct)"}`,
            `IP:       ${lead.ip ?? "unknown"}`,
            `When:     ${lead.createdAt}`,
          ].join("\n"),
        }),
      });
    } catch (err) {
      console.error("[lead] notification email failed (non-fatal)", err);
    }
  }

  return jsonResponse({ ok: true });
};

export const GET: APIRoute = () =>
  jsonResponse({ error: "Use POST." }, 405);
