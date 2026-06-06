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
  // Featured-artist application fields (type === "artist-application").
  type?: string;
  name?: string;
  instagram?: string;
  portfolio?: string;
  location?: string;
  style?: string;
  message?: string;
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

// Best-effort transactional notification via Resend. Never throws; a failed
// notification must not fail the submission.
async function sendNotification(
  env: any,
  subject: string,
  lines: string[],
): Promise<void> {
  if (!env?.RESEND_API_KEY || !env?.RESEND_FROM_EMAIL || !env?.LEAD_NOTIFY_EMAIL) {
    return;
  }
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
        subject,
        text: lines.join("\n"),
      }),
    });
  } catch (err) {
    console.error("[notify] email failed (non-fatal)", err);
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

  const createdAt = new Date().toISOString();
  const userAgent = request.headers.get("user-agent") ?? null;
  const source = body.source ?? "/";
  const referrer = body.referrer ?? null;

  // ===================================================================
  //  Featured-artist application — richer payload, same endpoint.
  //  Persisted to KV (applications aren't part of the `leads` D1 schema)
  //  and delivered by email notification.
  // ===================================================================
  if (body.type === "artist-application") {
    const name = (body.name ?? "").trim();
    const instagram = (body.instagram ?? "").trim();
    const portfolio = (body.portfolio ?? "").trim();
    const location = (body.location ?? "").trim();
    const style = (body.style ?? "").trim();
    const message = (body.message ?? "").trim();

    if (name.length < 2 || name.length > 120) {
      return jsonResponse({ error: "Please enter your name." }, 400);
    }
    if (!instagram && !portfolio) {
      return jsonResponse(
        {
          error:
            "Add an Instagram handle or a portfolio link so we can see your work.",
        },
        400,
      );
    }

    const application = {
      type: "artist-application",
      name,
      email,
      instagram: instagram || null,
      portfolio: portfolio || null,
      location: location || null,
      style: style || null,
      message: message ? message.slice(0, 4000) : null,
      source,
      referrer,
      ip,
      userAgent,
      createdAt,
    };

    try {
      if (env?.LEADS_KV) {
        await env.LEADS_KV.put(
          `application:${createdAt}:${email}`,
          JSON.stringify(application),
        );
      } else {
        console.log("[application] (no KV bound; dev mode)", application);
      }
    } catch (err) {
      console.error("[application] persist failed", err);
      return jsonResponse(
        { error: "Couldn't submit your application — try again." },
        500,
      );
    }

    await sendNotification(env, `New featured-artist application — ${name}`, [
      `Name:      ${name}`,
      `Email:     ${email}`,
      `Instagram: ${instagram || "—"}`,
      `Portfolio: ${portfolio || "—"}`,
      `Location:  ${location || "—"}`,
      `Style:     ${style || "—"}`,
      ``,
      `About the work:`,
      message || "(none provided)",
      ``,
      `Source:    ${source}`,
      `When:      ${createdAt}`,
    ]);

    return jsonResponse({ ok: true });
  }

  // ===================================================================
  //  Newsletter subscribe (default).
  // ===================================================================
  const lead = { email, source, referrer, ip, userAgent, createdAt };

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

  await sendNotification(env, `New StencilMaker lead — ${lead.email}`, [
    `Email:    ${lead.email}`,
    `Source:   ${lead.source}`,
    `Referrer: ${lead.referrer ?? "(direct)"}`,
    `IP:       ${lead.ip ?? "unknown"}`,
    `When:     ${lead.createdAt}`,
  ]);

  return jsonResponse({ ok: true });
};

export const GET: APIRoute = () =>
  jsonResponse({ error: "Use POST." }, 405);
