# Deploying to Cloudflare — step by step

> [!IMPORTANT]
> **This site deploys to Cloudflare Workers (Static Assets), not Cloudflare Pages.**
> Cloudflare recommends Workers for new projects ([announcement, Apr 2025](https://blog.cloudflare.com/full-stack-development-on-cloudflare-workers/));
> Pages is in maintenance mode. The repo is wired to **Workers Builds** (Git →
> `pnpm build` → `wrangler deploy`). Every step below targets the **Worker**
> (dashboard → Workers & Pages → the `stencilmaker` Worker), never a Pages
> project. The **"Deploying as a Cloudflare Worker"** block directly below is the
> quick reference; §1–§12 are the detailed walkthrough.

Numbered, no-skip. Follow in order; later steps depend on earlier ones.
Time estimate: **30 minutes** for a base deploy, **2 hours** including
all integrations from `LIBRARIES-AUDIT.md` Phase 1.

> Domain assumed throughout: **`thestencilmaker.com`**.
> Replace if yours differs.

---

## Deploying as a Cloudflare Worker (current path)

**Platform:** Cloudflare **Workers Builds** — a Git-connected Worker, not a Pages
project. Tell them apart in the dashboard: Workers Builds has a **Deploy command**
and **no Build-output-directory** field; Pages is the reverse.

**1. Repo config (already set):**

- `wrangler.toml` is a Workers Static-Assets config:
  ```toml
  name = "stencilmaker"            # MUST match the connected Worker's name
  main = "dist/_worker.js/index.js"
  compatibility_date = "2026-05-27"
  compatibility_flags = ["nodejs_compat"]

  [assets]
  directory = "./dist"
  binding = "ASSETS"
  ```
- `.assetsignore` (copied into `dist/` by `pnpm build`) lists `_worker.js` and
  `_routes.json` so the SSR bundle isn't served as a public static file.
- `astro.config.mjs` is unchanged (`output: "server"`, `@astrojs/cloudflare` v12).
  `src/pages/api/lead.ts` keeps using `locals.runtime?.env` — valid on v12.

**2. Dashboard build settings** (Workers & Pages → the **`stencilmaker`** Worker →
**Settings → Builds**):

- **Build command:** `pnpm install --frozen-lockfile && pnpm build`
- **Deploy command:** `npx wrangler deploy`  ← replaces the old `wrangler pages deploy`
- **Non-production branch deploy command:** leave default `npx wrangler versions upload`
- There is **no** build-output-directory field — output is `[assets].directory`.
- The `name` in `wrangler.toml` **must equal** this Worker's name, or the deploy
  errors. If your connected Worker is named differently, change `name` to match
  (or rename the Worker).

**3. First deploy:** push to `master`. Workers Builds runs `pnpm build`, then
`wrangler deploy`, which **auto-creates the `stencilmaker` Worker** (no
pre-created project needed) and uploads `./dist` as static assets. The old
`8000007 Project not found` error is gone — no Pages API is called.

**4. Bindings & secrets** now live on the **Worker** (not a Pages project):
uncomment the `[[d1_databases]]` / `[[kv_namespaces]]` blocks in `wrangler.toml`
once provisioned, and set secrets with `wrangler secret put TURNSTILE_SECRET`
(and `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `LEAD_NOTIFY_EMAIL`) or via the
Worker's **Settings → Variables and Secrets**. Follow §5–§7 below for the
provider setup; just attach the results to the Worker instead of a Pages project.

**5. Custom domain:** Worker → **Settings → Domains & Routes** → add
`thestencilmaker.com` and `www` (your zone is on Cloudflare, so this is one click).

**Manual / hotfix deploy:** `pnpm deploy` (= `astro build && cp .assetsignore dist/
&& wrangler deploy`). **Local Workers preview:** `pnpm preview:cf` (= `… && wrangler dev`).

---

## 0 — Prerequisites

- [ ] A **Cloudflare account** (free tier is enough). Sign up at
  [dash.cloudflare.com](https://dash.cloudflare.com/sign-up).
- [ ] A **GitHub** (or GitLab) account that owns a repo you can push to.
- [ ] Your custom **domain** registered, with DNS you can change. (If you
  registered it through Cloudflare Registrar, DNS is already on Cloudflare.)
- [ ] Local toolchain: Node 22+ (`nvm use`), pnpm 10 (`corepack enable`),
  `git`.
- [ ] (Optional) `gh` CLI authenticated: `gh auth login`.

Verify locally before pushing:

```bash
pnpm install
pnpm check        # 0 errors expected
pnpm build        # dist/ produced, no errors
```

---

## 1 — Push the code to GitHub

```bash
cd /home/bryan/StencilMakerWebsite
git add .
git commit -m "Migrate to Astro 5 + Cloudflare Workers stack"

# If the repo doesn't exist remotely yet:
gh repo create stencilmaker-website --private --source=. --remote=origin --push

# Otherwise:
git push -u origin master
```

Confirm at `https://github.com/<you>/stencilmaker-website` that the tree
contains `astro.config.mjs`, `wrangler.toml`, `src/`, and `public/`.

---

## 2 — Connect the repo to Workers Builds

This is a **Worker**, not a Pages project. Cloudflare builds from Git and runs
`wrangler deploy` (no build-output-directory field — that's the Pages tell).

1. Open [dash.cloudflare.com](https://dash.cloudflare.com/).
2. Sidebar → **Workers & Pages** → **Create** → **Workers** → **Import a
   repository** (Connect to Git).
3. Authorize GitHub if prompted, select the `stencilmaker-website` repo.
4. **Set up builds and deployments:**
   - **Production branch:** `master` (or `main`)
   - **Build command:** `pnpm install --frozen-lockfile && pnpm build`
   - **Deploy command:** `npx wrangler deploy`
   - **Non-production branch deploy command:** leave default
     (`npx wrangler versions upload`)
   - **There is no Build-output-directory field** — output is the `[assets]`
     directory in `wrangler.toml` (`./dist`).
   - **Build variables** (Settings → Builds → *Build variables and secrets*):
     - `NODE_VERSION` = `22`
     - `PNPM_VERSION` = `10`
5. Click **Save and Deploy**. `wrangler deploy` auto-creates the
   `stencilmaker` Worker on first run (no pre-created project needed).
6. You get a free `*.workers.dev` URL — open it; you should see the live site.

> The Worker `name` in `wrangler.toml` **must equal** the connected Worker's
> name or `wrangler deploy` errors on a name clash. If the first build fails,
> expand the log — the usual cause is `NODE_VERSION` not set to `22` (add it
> under **Settings → Builds → Build variables**, then retry the build).

---

## 3 — Wire up the custom domain

1. The `stencilmaker` Worker → **Settings → Domains & Routes** → **Add** →
   **Custom domain**.
2. Enter `thestencilmaker.com`. Cloudflare detects whether the DNS zone is
   already on Cloudflare:
   - **Yes (Cloudflare Registrar or Cloudflare nameservers):** click
     **Add domain** — done in 60 seconds.
   - **No (external registrar):** Cloudflare gives you NS records to set
     at your registrar. Propagation: 5 minutes to 48 hours.
3. Add `www.thestencilmaker.com` as a second custom domain on the same
   Worker; Cloudflare auto-redirects it to the apex.
4. **Verify TLS:** wait for the SSL status to show "Active" (auto-issued
   via Universal SSL).
5. **Force HTTPS:** Cloudflare dashboard → SSL/TLS → **Edge Certificates** →
   enable **Always Use HTTPS** and **Automatic HTTPS Rewrites**.

You should now be able to hit `https://thestencilmaker.com/` and see the
site.

---

## 4 — Cloudflare Web Analytics (cookieless, no banner)

1. Dashboard → **Analytics & Logs** → **Web Analytics** → **Add a site**.
2. Choose **Manual setup** — automatic injection is a Pages-only convenience
   and does not apply to a Worker. Copy the **beacon token** Cloudflare gives
   you.
3. Add the beacon snippet to `src/layouts/BaseLayout.astro` inside the
   `<head>` (or the `<slot name="head" />`), commit, and push — the next
   Workers build serves it on every page.
4. Data starts flowing within ~5 minutes.

---

## 5 — Cloudflare Turnstile (anti-bot for the lead form)

1. Dashboard → **Turnstile** → **Add site**.
2. Settings:
   - **Site name:** `StencilMaker — production`
   - **Hostnames:** `thestencilmaker.com`, `www.thestencilmaker.com`,
     and the Worker preview hostname (e.g. `stencilmaker.<your-subdomain>.workers.dev`).
   - **Widget mode:** **Managed** (invisible 95% of the time).
3. Save. Copy the **Site key** and **Secret key**.
4. Add the two keys to the **Worker** — they go to **two different places**:
   - **Site key → a _build_ variable.** The `stencilmaker` Worker →
     **Settings → Builds → Build variables and secrets** → add
     `PUBLIC_TURNSTILE_SITE_KEY` = the **site key**. Astro inlines
     `import.meta.env.PUBLIC_*` **at build time**, so it must exist during the
     cloud `pnpm build`. A local `.env` does **not** reach the cloud build.
   - **Secret key → a _runtime_ secret.** Same Worker →
     **Settings → Variables and Secrets** → add `TURNSTILE_SECRET` = the
     **secret key** (type: Secret), or run `wrangler secret put TURNSTILE_SECRET`.
   These are separate stores — build variables are **not** readable at runtime,
   and runtime secrets are not present during the build.
5. **Re-run the build** so the new site key gets inlined: push a commit, or use
   **Deployments → Retry build**. (Editing a runtime secret alone does *not*
   rebuild the HTML, so the site key won't appear until you rebuild.)
6. Visit `/#updates`; the Turnstile widget renders below the form.

---

## 6 — Cloudflare D1 (lead storage)

D1 is serverless SQLite — the simplest possible database for an email list.

### 6.1 Create the database

```bash
# Authenticate Wrangler once with your Cloudflare account.
pnpm exec wrangler login

# Create the database.
pnpm exec wrangler d1 create stencilmaker-leads
```

Wrangler prints something like:

```toml
[[d1_databases]]
binding = "DB"
database_name = "stencilmaker-leads"
database_id = "abcdef12-3456-7890-abcd-ef1234567890"
```

### 6.2 Bind it in `wrangler.toml`

Open `wrangler.toml`, uncomment the `[[d1_databases]]` block, paste the
`database_id` from step 6.1, commit, and push.

### 6.3 Bind it to the Worker (in `wrangler.toml`)

`wrangler.toml` is the **source of truth** for a Git-deployed Worker —
`wrangler deploy` reconciles bindings from it on every build, so a binding
added only in the dashboard can be overwritten. Uncomment the
`[[d1_databases]]` block, paste the `database_id` from step 6.1, commit, push:

```toml
[[d1_databases]]
binding = "DB"
database_name = "stencilmaker-leads"
database_id = "<id printed by `wrangler d1 create`>"
```

(You *can* also bind it in the dashboard — Worker → **Settings → Bindings →
Add → D1 database**, variable name `DB` — but keep it in `wrangler.toml` too,
or the next deploy may drop it.)

### 6.4 Create the `leads` table

This repo already ships `migrations/0001_init.sql`:

```sql
CREATE TABLE IF NOT EXISTS leads (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT    NOT NULL UNIQUE,
  source      TEXT,
  referrer    TEXT,
  ip          TEXT,
  user_agent  TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
```

Apply it to production with the migrations workflow (tracked, idempotent — it
records applied migrations in a `d1_migrations` table so it never double-runs):

```bash
pnpm exec wrangler d1 migrations apply stencilmaker-leads --remote
```

> Use `--local` instead of `--remote` to set up the local dev DB.
> `wrangler deploy` does **not** run migrations — you apply them yourself here.

Verify:

```bash
pnpm exec wrangler d1 execute stencilmaker-leads \
  --remote --command "SELECT name FROM sqlite_master WHERE type='table';"
```

Expected output: `leads`.

### 6.5 Test the form

Submit the form on the live site with a real email. Then:

```bash
pnpm exec wrangler d1 execute stencilmaker-leads \
  --remote --command "SELECT * FROM leads ORDER BY id DESC LIMIT 5;"
```

The row should be there.

---

## 7 — Resend (notification email)

### 7.1 Sign up + verify the domain

1. [resend.com](https://resend.com) → sign up (free tier = 3,000 emails/mo).
2. **Domains → Add domain** → `thestencilmaker.com`.
3. Resend gives you DNS records (DKIM, SPF, optionally DMARC). Add them
   in Cloudflare → **DNS → Records** for `thestencilmaker.com`. Cloudflare
   "proxied" should be **OFF** for these (gray cloud, not orange).
4. Click **Verify**. Takes 1-30 minutes.

### 7.2 Create an API key + sender

1. Resend → **API Keys → Create** → scope **Sending access**. Copy it.
2. Decide on a sender — e.g. `hello@thestencilmaker.com`.

### 7.3 Add the Resend values to the Worker (runtime)

These are read at **runtime** via `locals.runtime.env`, so set them as Worker
secrets/vars — `.env` is never read at runtime. Either run:

```bash
wrangler secret put RESEND_API_KEY      # paste the re_… key
wrangler secret put RESEND_FROM_EMAIL   # hello@thestencilmaker.com
wrangler secret put LEAD_NOTIFY_EMAIL   # your personal inbox
```

…or add them in the dashboard: Worker → **Settings → Variables and Secrets**.
(`RESEND_FROM_EMAIL` and `LEAD_NOTIFY_EMAIL` aren't secret — you may instead put
`RESEND_FROM_EMAIL` under `[vars]` in `wrangler.toml`.) Submit the form; you
should receive the lead email within seconds.

---

## 8 — Verify the deployment

Run through this checklist against the live site at
`https://thestencilmaker.com/`:

- [ ] Page loads in < 2 s on a cold tab (DevTools → Network → Disable cache).
- [ ] Lighthouse score: Performance ≥ 90, A11y ≥ 95, Best Practices ≥ 95,
  SEO = 100. (Run via Chrome DevTools or `pnpm dlx @lhci/cli@latest`.)
- [ ] View source → `<title>`, `<meta name="description">`, OG tags, Twitter
  card, canonical, JSON-LD all present.
- [ ] `https://thestencilmaker.com/robots.txt` returns 200 with the policy.
- [ ] `https://thestencilmaker.com/sitemap-index.xml` returns 200 with one
  URL.
- [ ] `https://thestencilmaker.com/llms.txt` returns 200 with the brief.
- [ ] `https://thestencilmaker.com/.well-known/security.txt` returns 200.
- [ ] Response headers (e.g. `curl -I`) show
  `strict-transport-security`, `content-security-policy`,
  `x-frame-options: DENY`, `x-content-type-options: nosniff`,
  `referrer-policy: strict-origin-when-cross-origin`.
- [ ] Submit the lead form with a real email → success toast → row in D1 →
  email arrives via Resend.
- [ ] Submit with garbage like `not-an-email` → "Please enter a valid email"
  shown inline, no request fired.
- [ ] Web Analytics dashboard shows the test pageview within 10 minutes.
- [ ] Open Graph preview tester:
  [opengraph.xyz/url/thestencilmaker.com](https://www.opengraph.xyz/url/https%3A%2F%2Fthestencilmaker.com) — image, title, description all rendered.
- [ ] [Rich Results Test](https://search.google.com/test/rich-results) on
  `thestencilmaker.com` shows the Organization, SoftwareApplication, and
  FAQ snippets valid.

---

## 9 — Submit to discovery

- **Google Search Console:** add property, verify via Cloudflare DNS TXT
  record (Cloudflare offers one-click verify), submit
  `sitemap-index.xml`.
- **Bing Webmaster Tools:** "Import from Google Search Console" — done in
  60 seconds once Google is set up.
- **IndexNow** (Bing, Yandex, Naver — instant indexing): the Cloudflare
  ruleset includes an opt-in IndexNow toggle under **Caching → Configuration**.
  Free, takes 30 seconds.

---

## 10 — Subsequent deploys

### Push to deploy (recommended)

```bash
git push origin master
```

Workers Builds auto-builds and runs `wrangler deploy`. Non-production branches
get a preview version via `wrangler versions upload`.

### Manual deploy

For hotfixes or out-of-CI deploys:

```bash
pnpm deploy   # = astro build && cp .assetsignore dist/ && wrangler deploy
```

### Roll back

The `stencilmaker` Worker → **Deployments** → pick a prior version →
**Rollback** (or `wrangler rollback`). Takes seconds.

---

## 11 — Local emulation that matches production

Astro's dev server (`pnpm dev`) is fast and ergonomic but doesn't emulate
the Cloudflare runtime — bindings (`DB`, `LEADS_KV`), `cf.connecting-ip`,
the Workers cache API, etc. For high-fidelity local testing:

```bash
pnpm preview:cf
```

Runs `astro build && wrangler dev`. Runtime secrets for the emulator come from
a gitignored **`.dev.vars`** file (one `KEY=value` per line) — *not* `.env`:

```ini
# .dev.vars  (local only; gitignored)
TURNSTILE_SECRET=...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=hello@thestencilmaker.com
LEAD_NOTIFY_EMAIL=you@example.com
```

To exercise the D1 binding locally without touching production, apply the
migration to the **local** dev DB first:

```bash
# One-time: apply the migration to the local dev DB.
pnpm exec wrangler d1 migrations apply stencilmaker-leads --local

# Then:
pnpm preview:cf
# Hit the printed localhost URL — bindings work, D1 writes go to the local DB.
```

---

## 12 — Troubleshooting

| Symptom | Fix |
| ------- | --- |
| Deploy step fails with `Project not found … [code: 8000007]` | The Git build is **Workers Builds**, but `wrangler pages deploy` (a *Pages* command) was being run — it calls the Pages API for a project that doesn't exist. Fix: deploy as a Worker. `wrangler.toml` must be a Workers config (`main` + `[assets]`, no `pages_build_output_dir`) and the Deploy command must be `npx wrangler deploy`. See "Deploying as a Cloudflare Worker" above. |
| `wrangler deploy` fails: name in config must match the Worker | `name` in `wrangler.toml` must equal the Worker your build is connected to (dashboard → Workers & Pages → the connected Worker). Make them match (edit `name`, or rename the Worker). |
| Build fails with `Cannot find module 'astro'` | `NODE_VERSION` not set to `22` in the Worker's **Build variables** (Settings → Builds). Add it, retry the build. |
| Build fails with `pnpm: command not found` | Add `PNPM_VERSION=10` to env (or switch build command to use `corepack enable && pnpm build`). |
| Lead form returns 500 | Worker → **Logs** (or `wrangler tail`). Most common: D1 binding mis-named (must be `DB`) or Turnstile secret missing. |
| Turnstile widget shows "Network Error" | Hostname for the widget doesn't include `thestencilmaker.com`. Add it in Turnstile settings. |
| Resend mail not sending | DNS records didn't propagate, or DKIM is not verified. Re-check `Domains` page on Resend. |
| `https://thestencilmaker.com/` returns Cloudflare 522 | Custom domain assigned but the latest Workers build hasn't published yet. Wait for it to finish. |
| CSP errors in browser console | A new script CDN you added isn't in `public/_headers`. Update the `Content-Security-Policy` line. |
| Sitemap shows internal-only routes | The sitemap integration filter in `astro.config.mjs` already excludes `/api/*`. To exclude more, edit the `filter` callback. |
| Stale build still showing | Hard-reload (`Cmd+Shift+R`). Cloudflare caches HTML at the edge for ~5 minutes per the `_headers` rules. |
| API route returns 404 | Confirm `output: "server"` in `astro.config.mjs` and `export const prerender = false` in `src/pages/api/lead.ts`. |
| Lighthouse complains "Avoid an excessive DOM size" | Already minor on this page. Phase 2 of the audit (`astro:assets`) removes redundant `<img>` markup. |

---

## Done.

You now have a production-grade marketing site running on Cloudflare's
edge network, with anti-bot lead capture, persistent storage, email
notifications, privacy-first analytics, and a security headers grade of A+.

When you're ready for Phase 2 (image pipeline, font self-host, nonce CSP,
Sentry, Lighthouse CI), pick items from
[`LIBRARIES-AUDIT.md`](./LIBRARIES-AUDIT.md) in order.
