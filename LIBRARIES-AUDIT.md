# Libraries & Vendors Audit — StencilMaker (2026)

> What a high-conversion marketing site needs in 2026, what this codebase
> ships today, and a phased plan to close every gap. Read once end-to-end,
> then work it in order — each phase is independently shippable.

---

## TL;DR — where we are

| Status | Area |
| ------ | ---- |
| ✅ Shipped | Framework (Astro 5), styling (Tailwind v4), icons (Phosphor + SRI), fonts (Syne/Manrope), responsive layout, semantic HTML, single-page composition |
| ✅ Shipped | SEO meta (title/desc/canonical/OG/Twitter), Schema.org JSON-LD (Organization + WebSite + SoftwareApplication + FAQPage), `robots.txt`, sitemap, `llms.txt`, `security.txt` |
| ✅ Shipped | Cloudflare Pages config (`_headers` with CSP, `_redirects`, PWA manifest), Lead capture skeleton (form → Pages Function → optional D1/KV/Resend), reduced-motion respect |
| 🟡 Stubbed | Cloudflare Turnstile site key, D1 database binding, Resend API key, Cloudflare Web Analytics token, real social URLs, OG share image, app-store URLs |
| 🔴 Missing | Compiled vs. CDN Phosphor (still CDN), advanced image pipeline (`astro:assets`), Web Vitals reporting, error tracking (Sentry), A/B testing, privacy + terms pages, blog/MDX content layer |

**Verdict:** The site is launch-ready as a v1 marketing page once Phase 1
secrets are configured (~2 hours). Phases 2-4 are polish + growth, doable
incrementally with no rewrites.

---

## What a 2026 marketing site actually needs

Search and discovery have bifurcated. **Classic SEO** (Google/Bing rankings)
still dominates intent-driven traffic, but **GEO** — Generative Engine
Optimization — increasingly drives consideration: ChatGPT, Claude,
Perplexity, and Google AI Overviews now answer "what's the best AI tattoo
stencil app?" by summarizing structured data and `llms.txt` files instead
of returning ten blue links.

A modern marketing site needs to win on six axes:

1. **Discoverability** — classic SEO + GEO + social cards
2. **Performance** — Core Web Vitals (LCP, INP, CLS) + mobile-first
3. **Conversion** — clean lead funnel, friction-free CTAs, social proof
4. **Trust** — security headers, CSP, privacy, transparent policy pages
5. **Insight** — analytics, attribution, error tracking, Web Vitals
6. **Scale** — content layer (blog, case studies, comparison pages)

The plan below maps each axis to concrete libraries and vendors.

---

## Phase 0 — Foundation (DONE)

Everything in this phase is already in the repo.

| Capability | Library / Vendor | Notes |
| ---------- | ---------------- | ----- |
| Framework | `astro@^5` | Static-first, partial hydration, Cloudflare adapter. |
| Styling | `tailwindcss@^4` + `@tailwindcss/vite` | CSS-first config in `src/styles/global.css`. |
| Adapter | `@astrojs/cloudflare@^12` | Compiles to a Cloudflare Worker for the `/api/lead` Function. |
| Sitemap | `@astrojs/sitemap@^3` | Auto-generated from routes at build time. |
| Icons | `@phosphor-icons/web@2.1.2` | CDN-pinned + SRI sha384. Replace with local sprites in Phase 2. |
| Form skeleton | Native `<form>` + `fetch` | Validates email, posts to `/api/lead`. Graceful degradation when Turnstile/D1/Resend aren't yet bound. |
| Security | `public/_headers` | CSP, HSTS, X-Frame-Options, Permissions-Policy, COOP/CORP. |
| GEO | `public/llms.txt` + JSON-LD `FAQPage` | First-class signals for generative engines. |

---

## Phase 1 — Pre-launch must-haves (1–3 hours)

**Goal:** flip the site from "demo" to "production." Everything in this
phase plugs into Cloudflare's free tier. Follow [`DEPLOY-CLOUDFLARE.md`](./DEPLOY-CLOUDFLARE.md)
for the exact dashboard clicks.

### 1.1 Cloudflare Web Analytics (cookieless, privacy-first)

- **Why:** Real-user data on pageviews, referrers, country, device — without
  cookies, without a banner. Built into Pages, free for any volume.
- **How:** Pages dashboard → Web Analytics → enable for your domain. Paste
  the snippet into `BaseLayout.astro` (one `<script>` line). Or skip the
  snippet entirely and use the automatic injection from the Pages project.
- **Effort:** 5 min.

### 1.2 Cloudflare Turnstile (anti-bot for the lead form)

- **Why:** Stops form spam without a recaptcha v3 cookie or a hCaptcha
  challenge. Invisible 95% of the time. Free.
- **How:** Cloudflare dashboard → Turnstile → add `thestencilmaker.com`
  widget. Copy the site key into Pages env vars as
  `PUBLIC_TURNSTILE_SITE_KEY`. Copy the secret key as `TURNSTILE_SECRET`.
  `LeadForm.astro` already reads `PUBLIC_TURNSTILE_SITE_KEY` and the
  Function in `src/pages/api/lead.ts` already verifies the token.
- **Effort:** 10 min.

### 1.3 Cloudflare D1 (lead storage)

- **Why:** Serverless SQLite. $0 for the first 100k reads/day. The lead
  Function inserts on a unique-email constraint so refreshes don't
  duplicate.
- **How:** `wrangler d1 create stencilmaker-leads`, paste the ID into
  `wrangler.toml`, run the migration in `DEPLOY-CLOUDFLARE.md`, bind in
  Pages project settings.
- **Effort:** 15 min.

### 1.4 Resend (transactional email)

- **Why:** Notifies you (one line in your inbox) every time a lead signs
  up. Optional but high-signal.
- **How:** Sign up at resend.com, verify `thestencilmaker.com` DNS, create
  an API key, set `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and
  `LEAD_NOTIFY_EMAIL` in Pages env vars.
- **Effort:** 20 min (mostly DNS propagation).

### 1.5 Open Graph share image

- **Why:** Every link share (Slack, iMessage, Twitter/X, Bluesky, Threads,
  LinkedIn) renders an image preview. Default OG = no image = looks broken.
- **How:** Design a 1200×630 PNG in your tool of choice (or generate
  dynamically with `@vercel/og`/`satori` — see Phase 2). Save to
  `public/assets/og-image.png`. Already wired in `src/consts.ts`.
- **Effort:** 30 min.

### 1.6 Privacy + Terms pages

- **Why:** Even cookieless analytics + a single email form trigger basic
  disclosure obligations under GDPR/CCPA (and Apple/Google won't let your
  apps reference a site without them).
- **How:** Add `src/pages/privacy.astro` and `src/pages/terms.astro` using
  the existing `BaseLayout`. Generate baseline text via Termly, Termageddon,
  or Iubenda (free tiers); paste, edit, and adapt.
- **Effort:** 1 hour.

### 1.7 Real CTAs

- **Why:** App Store / Play Store / Web App buttons in `Footer.astro`
  point at placeholder URLs (see `src/consts.ts`).
- **How:** Update `SITE.appStoreUrl`, `SITE.playStoreUrl`, `SITE.webAppUrl`
  in `src/consts.ts`. Single edit, propagated everywhere.
- **Effort:** 5 min.

**Phase 1 checklist before going live:**

- [ ] Web Analytics enabled, snippet active.
- [ ] Turnstile site + secret keys in env.
- [ ] D1 bound, migration applied.
- [ ] Resend domain verified, keys in env.
- [ ] `public/assets/og-image.png` exists at 1200×630.
- [ ] `/privacy` and `/terms` pages live.
- [ ] All three app links in the footer go somewhere real.
- [ ] Submit `sitemap-index.xml` in Google Search Console + Bing Webmaster.

---

## Phase 2 — Launch polish (4–8 hours, do in week 2)

### 2.1 `astro:assets` for image optimization

- **Why:** Images are the heaviest part of this site. `astro:assets` ships
  responsive `<picture>` with AVIF + WebP fallbacks, blurhash placeholders,
  and width-aware `srcset`. Easy 50-80% byte savings.
- **How:** Move `/public/gallery/*` → `/src/assets/gallery/*`, swap
  `<img>` for `<Image>` from `astro:assets`. Replace the testimonial
  Unsplash URL with a locally vendored portrait.
- **Effort:** 2 hours.

### 2.2 Vendor Phosphor Icons locally

- **Why:** Eliminates a CDN dependency, removes 6 stylesheet round-trips
  on first paint, hardens CSP (drops `https://unpkg.com` and
  `https://cdn.jsdelivr.net` from `script-src` and `style-src`).
- **How:** `pnpm add @phosphor-icons/web@2.1.2 --save-dev`, then import only
  the weights you use in `global.css`:
  ```css
  @import "@phosphor-icons/web/regular";
  @import "@phosphor-icons/web/fill";
  ```
  Remove the CDN `<script>` from `BaseLayout.astro`.
- **Effort:** 30 min.

### 2.3 Nonce-based CSP

- **Why:** Current CSP uses `'unsafe-inline'` in `script-src` for Astro's
  hydration scripts and JSON-LD. Nonces remove that escape hatch.
- **How:** Astro middleware that generates a per-request nonce and rewrites
  the CSP header + every inline `<script>`. See
  https://docs.astro.build/en/recipes/csp-nonce/ — works with the Cloudflare
  adapter because the marketing page is prerendered (so the nonce is set
  by `_headers` once at build, not per-request).
- **Effort:** 1.5 hours.

### 2.4 Dynamic OG image generation

- **Why:** Per-page OG images (different per blog post, per case study)
  drive higher click-through on social.
- **How:** `@vercel/og` running inside a Cloudflare Function — or the
  even simpler `astro-og-canvas` integration. Generate at build time for
  static routes.
- **Effort:** 1 hour.

### 2.5 Web Vitals reporting

- **Why:** Knowing your real-user LCP/INP/CLS distribution catches
  regressions before search rankings notice.
- **How:** `web-vitals@^4` library reports to a Cloudflare Function that
  appends to an Analytics Engine dataset. Or pipe directly to Cloudflare
  Web Analytics' custom events endpoint.
- **Effort:** 1 hour.

### 2.6 Font subsetting + self-host

- **Why:** Google Fonts adds two preconnects + a CSS round-trip and leaks
  the visitor's IP to Google. Self-hosting + subsetting drops ~150 ms LCP
  on mobile.
- **How:** `pnpm add fontsource-variable @fontsource-variable/syne
  @fontsource-variable/manrope`. Import in `global.css`. Remove the
  `<link>` tags from `BaseLayout`.
- **Effort:** 30 min.

### 2.7 Lighthouse budget in CI

- **Why:** Prevents regressions by failing PRs that drop scores. Pages
  doesn't enforce this — you have to.
- **How:** Add `treosh/lighthouse-ci-action` to a GitHub Actions workflow
  on every PR, with budgets defined in `lighthouserc.json` (LCP < 2.5s,
  TBT < 200ms, CLS < 0.1, A11y > 95).
- **Effort:** 1 hour.

### 2.8 Sentry for error tracking

- **Why:** Surface client-side JS errors and Function exceptions before
  customers complain.
- **How:** `pnpm add @sentry/astro`. Add the integration to
  `astro.config.mjs`. Set `SENTRY_DSN` in Pages env. Source maps are
  uploaded by the integration automatically.
- **Effort:** 30 min.

---

## Phase 3 — Growth (week 3+)

| Capability | Vendor | Why |
| ---------- | ------ | --- |
| Newsletter automation | **Resend Broadcasts** or **Buttondown** | Send your monthly bulletin straight to leads in D1. Resend has a programmatic API; Buttondown has a hosted writer UI. |
| A/B testing | **Cloudflare A/B testing on Workers** or **PostHog Experiments** | Multivariate hero copy + pricing. Cloudflare option needs no SDK. |
| Funnel analytics | **PostHog Cloud (EU region)** | Optional layer above Web Analytics; click maps, session recordings (with consent), conversion funnels. |
| CRM | **HubSpot Free** or **Attio** | Sync the D1 `leads` table on insert via a Cloudflare Queue + worker. Attio is the modern pick; HubSpot wins on tooling depth. |
| Customer support | **Plain** or **Crisp** | Live chat widget — load lazily so it never hurts CWV. |
| Affiliate / referral | **Rewardful** or **Tolt** | Lightweight affiliate tracking for the studios that retweet you. |
| Sales-led upsell | **Stripe Checkout** or **LemonSqueezy** | Already a fit since you charge $20/$30. Cloudflare Workers + Stripe is a clean integration. |

---

## Phase 4 — Content layer (month 2+)

Once the funnel is humming, the highest-leverage SEO/GEO investment is
written content. Astro's MDX support makes this nearly free.

| Capability | Library | Notes |
| ---------- | ------- | ----- |
| Blog | `@astrojs/mdx` + content collections | Type-safe frontmatter, RSS, OG images per post. |
| Case studies | Content collection `studios/` | Long-form per-artist features. Schema.org `Article` + `Person`. |
| Comparison pages | `vs/*` MDX routes | `/vs/procreate`, `/vs/midjourney` — high-intent search traffic. |
| FAQ knowledge base | Content collection `faq/` | Each FAQ becomes a JSON-LD `Question`. |
| RSS feed | `@astrojs/rss` | Standard, plus surfaces in Apple News + Feedly. |
| Search | **Pagefind** (static) or **Algolia DocSearch** (hosted) | Pagefind generates a static index at build, zero runtime cost. |
| CMS (optional) | **Sanity** or **Decap CMS** | Only needed when non-engineers write copy. Decap is git-backed and free. |

---

## Vendor cheat sheet

Costs assume the launch volumes (~10k visits/mo, ~500 leads/mo).

| Vendor | Free tier covers launch? | First paid tier |
| ------ | ------------------------ | --------------- |
| Cloudflare Pages | ✅ Unlimited builds, 500/mo on free | $20/mo Workers Paid |
| Cloudflare Web Analytics | ✅ Unlimited | n/a |
| Cloudflare Turnstile | ✅ Unlimited | n/a |
| Cloudflare D1 | ✅ 100k reads, 5M rows | $5/mo for more |
| Cloudflare R2 (images) | ✅ 10 GB storage | $0.015/GB after |
| Resend | ✅ 3,000 emails/mo | $20/mo for 50k |
| Sentry | ✅ 5k errors/mo | $26/mo |
| PostHog Cloud | ✅ 1M events/mo | $0 over via metered |
| Plain / Crisp | ✅ Free / freemium | $25–$45/mo |

**Estimated steady-state cost at launch volumes:** $0/month.

---

## Anti-patterns to actively avoid

1. **Google Analytics 4** — heavy, cookie-required, EU compliance gauntlet,
   data sampled at low volumes. Cloudflare Web Analytics is strictly better
   for a marketing site.
2. **Recaptcha v3** — fingerprints users, slower than Turnstile, and only
   works while signed into a Google account.
3. **Cookie consent banners** — only required when you set tracking cookies.
   Cloudflare Web Analytics doesn't, so no banner needed. Adding a banner
   you don't need is pure conversion drag.
4. **A `tailwind.config.js` file** — Tailwind v4 is CSS-first. Resist
   editing `tailwind.config.js`; tokens live in `src/styles/global.css`
   under `@theme`.
5. **Inline OG images as data URIs** — exceeds the 8 KB limit Facebook
   scraper enforces; serve a static `.png` from `/assets/`.
6. **Skipping `prerender = true`** — without it, the Cloudflare adapter
   runs the marketing page through a Function on every request: ~30 ms
   added latency for no benefit. Currently set; don't remove.
7. **CDN icon fonts in production** — see Phase 2.2. Acceptable for
   day-one launch, replace within two weeks.

---

## What to do next

1. Read [`DEPLOY-CLOUDFLARE.md`](./DEPLOY-CLOUDFLARE.md) end-to-end.
2. Execute Phase 1 (1.1 → 1.7) in dashboard order. ~2 hours total.
3. Ship to production. Verify lead form delivers email.
4. Park Phase 2 in a "Polish" milestone; pull items as bandwidth allows.
5. Defer Phase 3 + 4 until the site is collecting traffic — they're
   investments that compound, not pre-launch dependencies.
