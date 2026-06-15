# Website Audit — thestencilmaker.com

- **Date:** 2026-06-14
- **Target:** https://thestencilmaker.com (live, Cloudflare Workers + Static Assets)
- **Stack:** Astro 5 (SSR) + Tailwind v4, `@astrojs/cloudflare` v12
- **Scope:** all 7 public pages — `/`, `/artists/`, `/artists/apply/`, `/delete-account/`, `/privacy/`, `/support/`, `/terms/`
- **Lenses:** content · links/CTAs · visual/responsive · SEO/meta · accessibility · performance · security headers · privacy · backend health
- **Method:** static fetch + real-browser render (Chromium, 1440×900 & 390×844) + axe-core + Lighthouse (mobile) + link/header probes. Every finding re-verified before inclusion; false positives are listed at the end.

## Verdict

The site is **well-built and close to launch-ready** — strong security headers (CSP/HSTS/COOP, no cookies), SEO 100 and best-practices 100 in Lighthouse, no responsive overflow at any breakpoint, clean per-page SEO meta, and a polished dark visual design that renders correctly on desktop and mobile.

It is **not yet shippable** because of two hard blockers and a cluster of trust/conversion issues:

1. **Both app-store download CTAs are dead (404).** Every "Download / Get the app / Buy Credits" button on every page funnels to a footer whose App Store and Google Play links 404. There is no working purchase or download path anywhere on the site.
2. **A fabricated customer testimonial** ("Elias Thorne / Ghost Studio NYC" with a stock photo) sits under a "Trusted by masters" banner — a deception/FTC exposure on a commercial site.

Plus a homepage that takes **17.5s to reach LCP on mobile** (4 MB of unoptimized PNGs), and **site-wide WCAG AA contrast failures**.

## Severity counts

| Severity | Count |
|----------|------:|
| Blocker  | 2 |
| High     | 4 |
| Medium   | 15 |
| Low      | 12 |
| Ops/Health | 2 |

---

## Fix First (ordered)

1. **[blocker] Wire real, working App Store + Google Play URLs** (or hide the buttons until the apps are live). `consts.ts:31-32`. Until then every download/conversion CTA on the site is a dead end.
2. **[high] Remove or replace the fabricated "Elias Thorne" testimonial** and the stock-photo portrait. `SocialProof.astro:30-50`.
3. **[high] Optimize the homepage hero/gallery images** — `sm-upscaled.png` (1.4 MB) and `dragon-2.png` (1.27 MB) drive LCP to 17.5s on mobile. Convert to WebP/AVIF at ~2× display size via `astro:assets`. `Hero.astro:23,69`.
4. **[high] Fix site-wide color-contrast failures** (low-contrast `text-neutral-500` mono labels on the dark background). `global.css` / shared utility.
5. **[high] Give conversion CTAs a real destination** — "Buy Credits" / "Start trial" currently scroll to the dead footer; point credit packs at the live USDC web checkout. `Pricing.astro`.
6. **[medium] Reconcile the "Counsel-approved" badge** with the actual approval state (approved 2026-05-12, amended twice since; re-review outstanding). `privacy.astro` / `terms.astro` mastheads.
7. **[medium] CSP cleanup** — add `fonts.googleapis.com` to `connect-src` (kills a console error on every page) and drop the unused `unpkg.com`/`cdn.jsdelivr.net` allowances. `public/_headers:50`.
8. **[medium] Trailing-slash hygiene** — make the redirect 308, and make canonical/`og:url`/internal links use the trailing-slash form the sitemap already uses.

Ready-to-apply diffs for the unambiguous items (CSP, header version string, FTC "paid" wording, trailing-slash config) are in `./fixes/`.

---

## Site-wide findings (fix once, applies everywhere)

### BLOCKER

**B1 — App Store download link is dead (404).**
`consts.ts:31` `appStoreUrl: "https://apps.apple.com/app/stencilmaker"` (marked `// TODO confirm`). The URL is not a valid App Store path (needs `/<locale>/app/<slug>/id<number>`) and returns **HTTP 404**. Rendered as the "App Store" button in `Footer.astro:32-37` (every page) and listed as a payment method in `Pricing.astro:384`.
**Fix:** replace with the live App Store URL; remove the TODO. If the iOS app is not yet published, hide the button rather than ship a 404.

**B2 — Google Play download link is dead (404).**
`consts.ts:32` `playStoreUrl: "https://play.google.com/store/apps/details?id=com.stencilmaker.app"` returns **HTTP 404** (package not published / wrong id). Rendered in `Footer.astro:40-45` (every page) and `Pricing.astro:388`.
**Fix:** confirm the published package id and update; otherwise hide the button.

### HIGH

**H1 — Fabricated testimonial with a stock photo (trust / FTC risk).**
`SocialProof.astro:30-50`. A named endorsement — *"It eliminated an hour of iPad tracing per client…"* attributed to **"Elias Thorne / GHOST STUDIO // NYC"** — uses a generic Unsplash stock portrait (`images.unsplash.com/photo-1507003211169…`, `alt="Portrait of Elias Thorne, tattoo artist at Ghost Studio NYC"`). The person/studio appear invented. Sits under a "Trusted by masters" marquee. Publishing a fake testimonial is deceptive and an FTC endorsement-guide exposure.
**Fix:** remove, or replace with a real, consented customer quote (and a real photo), or reframe as a clearly illustrative statement with no named/pictured "customer."

**H2 — Homepage LCP = 17.5s on mobile (4 MB of unoptimized PNGs).**
Lighthouse mobile: home **perf 74**, **LCP 17.5s**, total weight **4,092 KiB** (support page, with no heavy images, scores 94 / LCP 1.8s). The LCP/hero image `/assets/sm-upscaled.png` is **1.38 MB** served raw from `public/` and displayed at 440×440 (`Hero.astro:23,69`, `loading="eager" fetchpriority="high"`); `/gallery/dragon-2.png` is **1.27 MB**, `hero-graphic-light.png` 692 KB.
**Fix:** route these through `astro:assets` `<Image>` (or pre-encode to WebP/AVIF at ~880px) — a 440px hero should be ~30-80 KB, not 1.4 MB. This single change should move home LCP under ~2.5s.

**H3 — Site-wide WCAG AA color-contrast failures (axe: serious).**
Every page fails `color-contrast` (home 27 nodes, terms 43, privacy 35). The recurring offender is the low-contrast mono label class (sampled `.text-neutral-500.text-xs.font-mono` — e.g. the header `v 2.0 // Neural Engine architecture` strip, section eyebrow labels, footer captions) on the near-black background.
**Fix:** lift those labels to at least `neutral-400`/`neutral-300` (or raise size/weight) to clear the 4.5:1 (3:1 for large) AA threshold. One shared utility change clears most nodes.

**H4 — Conversion CTAs dead-end at the footer.**
Nav "Download", hero "Get Started Free", pricing "Download Free" / "Start trial", and all three "Buy Credits" buttons use `href="#download"` (`Pricing.astro:300`, `Nav.astro`, `Hero.astro`), which scrolls to the footer — whose only links are the two dead store buttons (B1/B2). There is **no live web purchase path** for the USDC credit packs the page advertises.
**Fix:** after fixing B1/B2, point the credit-pack CTAs at the actual USDC web checkout URL (the page promotes "buy any credit pack with USDC on the web") rather than the download footer.

### MEDIUM

**M1 — CSP `connect-src` omits `fonts.googleapis.com` → console error on every page.**
`public/_headers:50`. `connect-src 'self' https://challenges.cloudflare.com https://cloudflareinsights.com` blocks a connection to the Google Fonts CSS endpoint; every rendered page logs *"Connecting to 'https://fonts.googleapis.com/css2…' violates … connect-src"*. Fonts still render (allowed under `style-src`, no failed requests), so impact is console noise + a real CSP correctness gap (and broken CSP reporting).
**Fix:** add `https://fonts.googleapis.com` to `connect-src`. See `fixes/01-csp.diff`.

**M2 — Overly permissive CSP allows unused origins.**
`public/_headers:50`. `script-src`/`style-src`/`img-src` allow `https://unpkg.com` and `https://cdn.jsdelivr.net`, but neither host appears anywhere in source (icons are local inline SVG; only `images.unsplash.com` is actually used, by SocialProof). Allowing script execution from CDNs you don't use widens the attack surface.
**Fix:** remove `unpkg.com` and `cdn.jsdelivr.net` from all directives. See `fixes/01-csp.diff`.

**M3 — Trailing-slash inconsistency (SEO + redirect-on-click).**
The site enforces trailing slashes via a **307** (temporary) redirect (`/artists` → `/artists/`), and the sitemap uses the slash form — but (a) `canonical`/`og:url` are emitted **without** the slash (`https://thestencilmaker.com/artists`), so the declared canonical 307-redirects and disagrees with the sitemap; (b) the header nav links use the no-slash form (`href="/artists"`, 3×) so every header click eats a redirect, while footer links use the slash form. `BaseLayout.astro:19` computes the canonical; redirect behavior is Cloudflare `html_handling`.
**Fix:** set Astro `trailingSlash: "always"` + `build.format: "directory"` so canonical/links/served URLs all agree, and make the canonical structural redirect a **308**. See `fixes/04-trailing-slash.diff`.

**M4 — "Counsel-approved" badge overstates the current document's status.**
Privacy + Terms mastheads render a public **"Counsel-approved"** status with "Last updated June 9, 2026 / v2026.06.09". Source history: counsel approved **2026-05-12**, then the docs were amended **2026-06-07** and **2026-06-09** (AI-provider + version changes). Project memory records counsel re-review of the amendment as still outstanding. Displaying counsel approval for an un-re-reviewed amendment is a misleading public compliance claim.
**Fix:** either obtain + record counsel re-approval of v2026.06.09, or change the badge to "Current" / remove it from the public masthead.

**M5 — Style-engine count contradicts itself (4 vs 10).**
`StyleGallery.astro:44` headlines **"Four Distinct Vocabularies."** and shows 4 styles, with no "sample of" framing — while the same page's JSON-LD (`JsonLd.astro:123` `"10 distinct style engines"`, `:164` lists all ten) and the support FAQ say **10 style engines**, and pricing says "All style engines unlocked." A human reads 4; crawlers/AI ingest 10.
**Fix:** reframe to "Ten Style Engines" (show more, or label the 4 as a selection), so the human-visible count matches the structured-data claim.

**M6 — JSON-LD asserts numbers/features not visible on the page.**
`JsonLd.astro:156` FAQ answer claims daily limits **"up to 10 stencils per day (5/day on the monthly plan, 10/day on the annual plan)"** and `:121` `featureList` claims "Background removal", "Thermal printer support", "Cloud sync + offline mode" — none of the per-plan numbers appear in visible body copy. Google's FAQ/structured-data policy requires the marked-up content to be visible to users; invisible claims risk a manual action and, if wrong, misrepresent the product to AI answer engines.
**Fix:** surface the per-plan limits in the visible pricing copy, or remove them from the schema; verify each `featureList` claim is true and shown.

**M7 — Invalid definition-list semantics (axe: serious) on the legal pages.**
`privacy` (18 `dlitem` violations + 2 `definition-list`), `terms` (4 + 1), `delete-account` (2 + 1): `<dt>`/`<dd>` are not correctly wrapped in a `<dl>` (or the `<dl>` has disallowed children). Screen readers won't announce the term/definition relationship.
**Fix:** wrap each term/definition group in a single `<dl>` containing only `<dt>`/`<dd>` (no intervening wrapper divs), in `privacy.astro` / `terms.astro` / `delete-account.astro`.

**M8 — Implied endorsement of Bruno Moretti contradicts the stated disclosure.**
`/artists/`: *"His booking flow asks every client for reference images — the same starting point StencilMaker turns into clean, vector-grade transfer linework in seconds."* `consts.ts:97-100` explicitly states "We do NOT claim he personally uses StencilMaker." The sentence couples his documented practice to the product output in a way that reads as implied use.
**Fix:** reframe to describe the product's proposition for artists *like* Bruno, not a tie to his own workflow.

**M9 — Material-connection (paid) not disclosed for the partner.**
`/artists/` disclosure reads *"Bruno is a featured StencilMaker partner."* `consts.ts:97` notes he is a **paid** partner. FTC guidance requires clear disclosure of paid/material connections.
**Fix:** add "paid" / "sponsored": *"Bruno is a paid featured partner."* See `fixes/03-ftc-paid-partner.diff`.

**M10 — Privacy policy contradicts itself on Free-tier retention.**
`privacy.astro` §Uploads: Free-tier uploads are *"processed and not retained beyond generation"* — but §Data retention: *"Free-tier stencils — Purged 24 hours after generation."* "Not retained beyond generation" ≠ "kept up to 24h."
**Fix:** align §Uploads to the 24-hour window.

**M11 — `/delete-account/` describes no data-export option.**
The only "export" on the page is file-format export (PNG/PDF/SVG) carried in shared JSON-LD; there is no "get a copy of your data before you delete" path. Project memory: export is email-channel by design — so it should be stated. Apple 5.1.1(v) / GDPR/CCPA expect this.
**Fix:** add a line: "Want a copy of your data first? Email us and we'll send it before deletion."

**M12 — Deletion warning omits forfeited web/USDC credits.**
`delete-account.astro:382` warns about App Store / Google Play subscriptions but says nothing about purchased credit packs. Users who bought USDC credit packs lose remaining (non-refundable) credits on deletion with no notice.
**Fix:** add that unused credits — including web/USDC packs — are forfeited and non-refundable on deletion.

**M13 — Placeholder social profiles in Organization JSON-LD.**
`JsonLd.astro:26-31` emits `sameAs: [twitter.com/stencilmaker, instagram.com/stencilmaker, tiktok.com/@stencilmaker]` with the comment *"TODO: add real social URLs once accounts are live."* `SITE.twitterHandle = "@stencilmaker"` also feeds `twitter:site`. These platforms return soft-200s for nonexistent handles, so this is unverified/likely-fake brand markup.
**Fix:** verify each account exists and is claimed, or remove from `sameAs` (and clear `twitterHandle`) until live.

**M14 — Unverified legal/privacy contact mailboxes.**
Privacy renders `privacy@thestencilmaker.com` (4×); Terms renders `legal@thestencilmaker.com` (2×). Neither is defined in `consts.ts` (only `support@`, `press@`). The privacy policy commits to honoring data requests at these addresses.
**Fix:** confirm `privacy@` and `legal@` are live, monitored aliases (or route to `support@`).

**M15 — Overstated public compliance assertion.**
Privacy + Terms each state the disclosure *"satisfies App Store Review Guideline 5.1.2(i) and Google Play's AI-Generated Content policy."* Platform compliance is determined by reviewers at review time and the guidelines evolve; a static "satisfies" claim can silently become false.
**Fix:** soften to "is designed to meet" / "intended to comply with."

### LOW

- **L1** — Footer `Footer.astro:26`: *"Join professional artists who have upgraded their workflow"* — unsubstantiated; implies an existing user base. Reframe aspirationally or substantiate with a real number.
- **L2** — `SocialProof.astro:11` decorative marquee *"TRUSTED BY MASTERS"* (opacity 0.03, `aria-hidden`) — unsubstantiated trust claim, though near-invisible. Drop or neutralize once the fake testimonial is removed.
- **L3** — Credit-pack card shows big "550 credits" with "+50 bonus" beneath (`Pricing.astro:283-289`); 550 is already the total, so the framing can read as 600. Math/stencil count (≈27) is correct. Clarify as "550 total (incl. 50 bonus)."
- **L4** — `Header.astro:24` `v 2.0` → `v2.0` (non-standard spacing). See `fixes/02-header-version.diff`.
- **L5** — axe `heading-order` (moderate) on `/artists/apply/` — a heading level is skipped.
- **L6** — axe `link-name` (serious) on `/artists/apply/` mobile — an icon-only link has no accessible name; add `aria-label`.
- **L7** — Terms §AI generation leaks an implementation detail: *"the prompt template is assembled server-side."* Plain-language it.
- **L8** — `delete-account.astro:~356` *"On the Web app? Use the email request below — the same steps apply"* — the mobile steps (tap Settings tab → Delete account) don't literally apply on web; reword.
- **L9** — `consts.ts:31,33` stale `// TODO confirm` comments on `appStoreUrl` and `webAppUrl` (the web app URL itself resolves 200). Resolve/remove.
- **L10** — Terms has no refund clause for **USDC/Coinbase** credit packs (no App Store/Google Play backstop for web purchases). Add an "all sales final / non-refundable" line.
- **L11** — `public/_headers:1` comment says "Cloudflare Pages headers" though the site is deployed on Workers Static Assets (works there too). Update the comment.
- **L12** — `consts.ts:74-78` source comments leak internal file paths / flag names (`credit.py`, `config.py`, `STENCIL_USDC_DOUBLE_BONUS`, `Settings.usdc_double_bonus`). Source-only (not in rendered HTML) — move to an internal doc to avoid leakage via source maps.

---

## Per-page notes

| Page | Status | Notable |
|------|:------:|---------|
| `/` | 200 | Heavy LCP (H2); fabricated testimonial (H1); 4-vs-10 styles (M5); CTA dead-ends (H4) |
| `/artists/` | 200 | Implied endorsement (M8); paid-partner disclosure (M9); external artist links all 200 |
| `/artists/apply/` | 200 | Turnstile widget **present** (form anti-bot wired); heading-order + link-name a11y (L5/L6) |
| `/delete-account/` | 200 | No data-export option (M11); credit-forfeit warning gap (M12); dl semantics (M7) |
| `/privacy/` | 200 | Retention self-contradiction (M10); 18 dl a11y violations (M7); counsel badge (M4) |
| `/support/` | 200 | JSON-LD limits not on-page (M6); highest mobile contrast load |
| `/terms/` | 200 | Counsel badge (M4); compliance overstatement (M15); no USDC refund clause (L10) |

## What's good (verified, no action)

- **Security headers:** full CSP, HSTS w/ `preload`, `X-Frame-Options: DENY`, `Referrer-Policy`, `X-Content-Type-Options`, `Permissions-Policy`, COOP. No cookies set → correctly **no cookie banner** (cookieless Cloudflare analytics).
- **Responsive:** `scrollWidth == innerWidth` (overflowPx = 0) on all 7 pages at both 1440 and 390 — no horizontal scroll, no fixed-width canvas. All geometry "overlaps"/"clipped" were verified false positives (reflowed text bounding boxes; StyleGallery carousel slides).
- **SEO:** unique self-referencing `canonical`, per-page `og:`/`twitter:` tags, valid `og:image` (1200×630 on canonical host), Lighthouse SEO **100**. Sitemap matches crawl (7/7), no domain mismatch, robots sitemap correct.
- **Lighthouse:** best-practices **100**, a11y **96**, SEO **100** on both sampled pages; support perf **94**.
- **Discovery:** no broken internal links; external artist/social links (brunomorettitattoo.com, instagram, youtube) and `app.thestencilmaker.com` all 200.

---

## Ops / Health (not counted in site-quality severity)

- **O1 — `www.thestencilmaker.com` returns 522** (Cloudflare connection timeout); there is no `www` → apex redirect. The apex (`thestencilmaker.com`) serves 200. Anyone typing/linking `www.` hits an error page.
  **Fix:** add a `www` → apex 301 (Cloudflare redirect rule or DNS/Worker route).
- **O2 — Lead/apply form end-to-end delivery unverified.** `/api/lead` is wired and `wrangler.toml` binds `DB` + `LEADS_KV`; but persistence + operator email require `LEADS_KV` bound in the deployed Worker and the three Resend secrets (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `LEAD_NOTIFY_EMAIL`) set. `lead.ts` silently logs (HTTP 200) if KV is unbound, and skips email if any Resend var is missing — so a misconfig fails *silently*. Not probed live (a test POST emails the operator + writes KV).
  **Fix:** submit one real test application and confirm it persists + emails; consider returning 500 (not 200) when no storage is bound in production.

---

## Verified false positives (investigated, NOT defects)

- "SEO meta missing on 6/7 pages" — artifact of fetching no-trailing-slash URLs without following the 307. All pages have full, unique meta.
- "Starter pack ≈27 stencils is wrong, should be 30" — `credits: 550` is the **total** (base 500 + 50 bonus); `floor(550/20)=27` is correct and consistent across packs (1100→55, 3000→150).
- "Turnstile widget absent / form bypasses anti-bot" — `cf-turnstile` **is** present in the rendered `/artists/apply/`.
- "Mobile layout overlaps/clipping" (6-18 per legal page) — text-reflow bounding-box intersections + StyleGallery carousel slides; overflowPx = 0, screenshots clean.
- "Web App footer link dead" — `app.thestencilmaker.com` returns 200.

## Artifacts

- `findings.json` — machine-readable findings
- `fixes/` — ready-to-apply diffs for the unambiguous mechanical fixes
- `screenshots/` — full-page + per-section, both breakpoints
- `render/` — per-route axe / console / network / geometry JSON
- `lighthouse/` — home + support mobile reports
- `linkcheck.txt`, `headers.txt`, `discover-report.json`
