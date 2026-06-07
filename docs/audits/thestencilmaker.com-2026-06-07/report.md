# StencilMaker — Website Audit

**Site:** https://thestencilmaker.com/  
**Date:** 2026-06-07  
**Repo:** `/home/bryan/StencilMakerWebsite` (Astro 5 `output:server` + Tailwind v4, on Cloudflare Workers + Static Assets)  
**Method:** static fetch + headless Chromium render (desktop 1440×900 + mobile 390×844, scroll-reveal triggered) + axe-core + Lighthouse (mobile) + live link/header probes, then every finding re-verified against raw HTML / a fresh render / the source, and source-mapped to `file:line`.  
**Pages live:** `/`, `/privacy/`, `/terms/` (3). **Pages in repo but 404 in production:** `/artists`, `/artists/apply`.

**Severity (site quality):** 🔴 2 blocker · 🟠 8 high · 🟡 9 medium · ⚪ 11 low  ·  **Ops:** 1 blocker + 1 high (separate)

---

## Part 1 — Browser-verified visual & runtime findings

> The things only a live render/probe catches. Lead here; highest signal.

### 🔴 The live site is a stale deploy — the newest feature 404s and the homepage links to it
- `GET /artists` → **404**, `GET /artists/apply` → **404** (both mobile + desktop render confirmed `status=404`).
- The **live homepage links to `/artists`** from the SponsoredArtist "read the full feature" CTA *and* the Footer "Artist Directory" link → users land on a 404.
- The live homepage copy is **itself stale**: it renders `"Argentina-born … freehand dark art"` while current source (`consts.ts:95`) says `"Patagonia-born …"`. So production is an older build, not just missing the new sub-pages.
- **Proof it's a deploy gap, not a build gap:** local `dist/` already contains `dist/artists/index.html`, `dist/artists/apply/index.html`, and a 5-URL `dist/sitemap-0.xml`. The build is correct; the deploy was never pushed. Latest commit `d6f5df4` ("Add featured-artist application feature", 2026-06-06) is not live.
- **Fix:** redeploy `master`, and confirm Workers Builds auto-deploys on push. ⚠️ *But read H3 first — redeploying as-is also ships a "10 Distinct Vocabularies" heading over only 4 style cards.*

### 🔴 Every primary "get the app" CTA is dead
Probed live (3× each), all wired site-wide via the Footer badges + the hero/CTA blocks ("APP STORE / GOOGLE PLAY / WEB APP"):

| CTA | URL | Result |
|---|---|---|
| App Store | `apps.apple.com/app/stencilmaker` | **404** (no country/id — placeholder) |
| Google Play | `play.google.com/store/apps/details?id=com.stencilmaker` | **404** (package doesn't exist) |
| Web App | `app.thestencilmaker.com` | **NXDOMAIN** — no DNS record (curl code `000`) |

These are exactly the three `// TODO confirm` URLs in `consts.ts:31-33`. Combined with the dead forms (see Ops), the **entire conversion funnel is non-functional**.

### 🟠 OG image 404 — broken social cards on every page
`<meta property="og:image" content="https://thestencilmaker.com/assets/og-image.png">` → **404**. The file isn't in `public/assets/` (`consts.ts:25` even flags `// TODO: generate 1200x630 OG card`). Every share on social/Slack/iMessage renders blank. (Lighthouse SEO is still 100 because it checks the tag is *present*, not that it *resolves*.)

### 🟠 Cloudflare is injecting a robots.txt that fights the site's own GEO strategy
The live `robots.txt` has a **Cloudflare "Managed Content" block prepended** that says `Content-Signal: ai-train=no` and `Disallow: /` for `ClaudeBot, GPTBot, Google-Extended, Bytespider, Applebot-Extended, meta-externalagent, CCBot, Amazonbot` — directly above the site's own block, which **Allows all of them**. The repo `robots.txt`, the `SEO.astro` GEO meta tags, and `llms.txt` all deliberately invite AI engines. A dashboard feature (AI Crawl Control / Content Signals) is overriding that intent and making the policy self-contradictory. **Decide the policy and make robots agree with itself** (most likely: turn the managed block off in the Cloudflare dashboard).

### ✅ Responsive & visual: clean (with false-positive corrections)
- **Horizontal overflow = 0** on every page at 390px — fully responsive, no fixed-width canvas, no sideways scroll.
- The geometry detector's "overlaps"/"clipped" hits are all **false positives**, confirmed in the screenshots: the Input/Output before-after slider (intentional overlap), the collapsed mobile nav drawer, the off-canvas `#style-rail` carousel slides, and the oversized "01/02" legal-section index numerals. No real text collisions.
- Screenshots in `screenshots/` (`home_*`, `privacy_*`, `terms_*` at desktop + mobile).

### ✅ Security headers & privacy posture: clean
- CSP, HSTS (`max-age=63072000; includeSubDomains; preload`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP/CORP all present and sane. No `Set-Cookie`. (`_headers` is honored even on Workers Static Assets.) Minor: CSP still uses `'unsafe-inline'` for scripts — acknowledged Phase-2 nonce upgrade.
- **Cookieless** (Cloudflare Web Analytics) with **no consent banner** — correct, not a defect. (The policy should still *disclose* it — see L5.)

---

## Executive Summary

Four problem classes dominate:

1. **Production is behind `master` (stale deploy).** The flagship featured-artist feature is committed but not live: `/artists` and `/artists/apply` 404, and the homepage already links to them. The single highest-leverage fix is a redeploy — **but it must be paired with the source fixes below**, because the current source would ship a style-gallery contradiction (H3) and still carries the OG/CTA/legal defects.
2. **The conversion funnel is broken end-to-end.** All three app-download CTAs 404/NXDOMAIN, *and* both lead forms silently drop every submission (no Cloudflare bindings configured) while showing "success". A visitor who wants in literally cannot get in, and you capture nothing.
3. **Trust & legal exposure.** A fabricated testimonial with a stock-photo "portrait", an unsubstantiated "first/trusted by masters" narrative, legal-contact emails on the wrong domain (`@stencilmaker.app` vs `thestencilmaker.com`), and an incomplete sub-processor disclosure.
4. **A11y + performance polish.** Site-wide low-contrast micro-text (axe *serious*, 23–43 nodes/page) and ~5 MB of unoptimized hero/gallery PNGs that blow mobile LCP out to 26 s.

**Single highest-leverage fix:** redeploy `master` **after** fixing the OG image, the StyleGallery heading, and the three app URLs in source — one release then clears the 404s, the stale copy, the broken cards, and the dead CTAs together.

---

## Severity Counts

| Severity | Count | What |
|---|---|---|
| 🔴 Blocker | 2 | Stale deploy (404s + homepage links to them); all app-download CTAs dead |
| 🟠 High | 8 | OG image 404; CF robots vs GEO; site-wide contrast; fabricated testimonial; StyleGallery 10-vs-4; oversized images/LCP; legal email domain; processor disclosure gap |
| 🟡 Medium | 9 | scrollable rail a11y; malformed `<dl>`; sitemap incomplete; FAQ 10/day; "first" claim; "trusted by masters"; Meta sign-in claim; governing-law; cookie disclosure |
| ⚪ Low | 11 | trailing-slash tax; keywords brand; topographic/-al; licence; leaked impl detail; no legal entity; processor split; refund clause; + artist-page source items |
| ⚙️ Ops | 1 blk + 1 high | Forms silently drop submissions; release process behind master |

---

## Site-wide Issues
*Fix once in shared layout/component/config.*

| ID | Sev | Issue | Location | Fix | Source |
|---|---|---|---|---|---|
| SW1 | 🔴 | Stale deploy: `/artists`, `/artists/apply` 404; homepage links to them; homepage copy older than source | live deploy | Redeploy `master`; verify auto-deploy | build artifacts present in `dist/` |
| SW2 | 🔴 | All 3 app CTAs dead (App Store/Play 404, Web App NXDOMAIN) | Footer + hero/CTA | Real URLs or "coming soon" state | `consts.ts:31-33` → `Footer.astro:31,39,47` |
| SW3 | 🟠 | `og:image` → 404 (broken social cards everywhere) | every page `<head>` | Create `public/assets/og-image.png` (1200×630); stopgap → point at an existing asset | `consts.ts:25` |
| SW4 | 🟠 | CF managed robots.txt `Disallow: /` for AI bots contradicts repo robots + SEO meta + llms.txt | live robots.txt | Disable CF AI Crawl Control / Content Signals (or flip the repo policy to match) | Cloudflare dashboard |
| SW5 | 🟠 | axe `color-contrast` *serious* (23–43 nodes/pg): gray/mono micro-text on obsidian | `text-neutral-500`, `text-stencil`, `.text-xs.font-mono` | Lift neutral text ramp; verify accent ≥4.5:1; re-run axe | `global.css` + utilities |
| SW7 | 🟠 | Fabricated testimonial "Elias Thorne / Ghost Studio NYC" + Unsplash stock portrait | homepage | Real consented testimonial or remove | `SocialProof.astro:19-46` |
| SW8 | 🟡 | Unsubstantiated "**first** AI architecture …" (copy + JSON-LD) | hero/meta | Drop "first" or qualify | `consts.ts:13` |
| SW6 | ⚪ | Trailing-slash redirect tax: `/privacy`,`/terms` 307→`/x/` but internal hrefs omit slash | Footer + cross-links | Add slash to hrefs; prefer 308 | `Footer.astro:62-64`, `privacy.astro:199`, `terms.astro:189` |
| SW9 | ⚪ | Keywords meta "stencil maker app" (two-word brand) | meta | "stencilmaker app" (cosmetic) | `consts.ts:20` |

---

## Per-page Issues

### `/` (homepage)
| ID | Sev | Issue | Fix | Source |
|---|---|---|---|---|
| H1 | 🟠 | Unoptimized images: `hero-graphic-light.png` **2.4 MB**, `sm-upscaled.png` 1.6 MB, `dragon-2.png` 1.3 MB → mobile **LCP 26.1 s** (CLS 0.002 ✓, TBT 0 ✓). Perf 74. | Convert to WebP/AVIF + `srcset`; route through `astro:assets`. The 2.4 MB hero is the LCP element. | `public/assets/*` |
| H3 | 🟠 | **Pre-deploy regression:** `StyleGallery.astro:43` hardcodes "10 Distinct Vocabularies." but the array has only **4** cards (live still shows 10). Redeploy introduces the contradiction. | Restore 6 styles or change the heading **before** redeploy | `StyleGallery.astro:43` (4 `blurb:` entries) |
| H2 | 🟡 | axe `scrollable-region-focusable`: `#style-rail` not keyboard-accessible | `tabindex="0"` + `aria-label`, or prev/next buttons | `StyleGallery.astro` |
| H4 | 🟡 | FAQ JSON-LD "up to 10 stencils per day" omits monthly = 5/day | "(5/day monthly, 10/day annual)" | `JsonLd.astro:156` vs `Pricing.astro:39` |
| H5 | 🟡 | "TRUSTED BY MASTERS" marquee — no verifiable artists | substantiate or soften | `SocialProof.astro:7` |
| H6 | ⚪ | "topographic" (alt) vs "topographical" (blurb) same card | standardize | `StyleGallery.astro:26,28` |

### `/privacy/` & `/terms/`
| ID | Sev | Issue | Fix | Source |
|---|---|---|---|---|
| L1 | 🟠 | Contact emails `@stencilmaker.app` (privacy@, legal@) ≠ canonical `thestencilmaker.com` | confirm mailbox or switch domain | `privacy.astro:749/756`, `terms.astro:801/808` |
| L2 | 🟠 | Processor table omits Cloudflare, **Resend**, **Turnstile** (proven used), Apple/Google identity | add rows; add cookieless-analytics line | `privacy.astro:87-89` |
| L3 | 🟡 | "Meta / Instagram" listed as sign-in provider — verify it exists | remove if not implemented | `privacy.astro:45` *(unverified — check app)* |
| L4 | 🟡 | "governed by the laws of the **United States**" but venue is Delaware | → "laws of the State of Delaware" | `terms.astro:111,674` |
| L5 | 🟡 | No analytics/cookie disclosure (despite cookieless analytics running) | add one-line cookieless disclosure | `privacy.astro` |
| L6 | ⚪ | "licence" (British) vs "licensed" (American) elsewhere | → "license" | `terms.astro:497` |
| L7 | ⚪ | Leaked impl detail "prompt template is assembled server-side" | remove the clause | `terms.astro:750` |
| L8 | ⚪ | No legal entity named in either doc (only footer) | name the entity at top | both legal pages |
| L9 | ⚪ | No refund/non-refundability clause (USDC packs non-refundable) | add refund clause | `terms.astro` §05 |

### `/artists` & `/artists/apply` — source review (not yet live)
*Audit them now since you're about to redeploy.*
| ID | Sev | Issue | Fix | Source |
|---|---|---|---|---|
| AR1 | 🟠 | Decorative marquee `<h2>` not in an `aria-hidden` container → pollutes heading outline | `aria-hidden="true"` on wrapper, or `<span>` | `artists.astro:523-528` |
| AR4 | 🟡 | Verbatim Bruno quote immediately followed by editorial copy w/ no break → ambiguous attribution | separate with figcaption/paragraph | `artists.astro:32` |
| AR2 | 🟡 | Apply form `novalidate` but inputs lack `aria-required`/`aria-invalid`; JS errors not associated | add aria-required + aria-invalid + aria-describedby | `artists/apply.astro:198,487-503` |
| AR3 | ⚪ | Generic `og:image:alt`; no breadcrumb JSON-LD on `/artists/apply` | artist-specific alt + breadcrumb | `SEO.astro:35`, `artists/apply.astro` |

---

## Broken / Suspect Links

| URL | Status | Where | Note |
|---|---|---|---|
| `…/artists` | **404** | homepage CTA + footer | stale deploy (SW1) |
| `apps.apple.com/app/stencilmaker` | **404** | footer + hero | placeholder `// TODO confirm` |
| `play.google.com/…id=com.stencilmaker` | **404** | footer + hero | placeholder |
| `app.thestencilmaker.com` | **000 / NXDOMAIN** | footer + hero | no DNS record |
| `…/assets/og-image.png` | **404** | `og:image`/`twitter:image` (all pages) | missing asset (SW3) |
| `…/privacy`, `…/terms` | 200 *via 307* | footer | redirect tax (SW6) |
| `fonts.googleapis.com/`, `fonts.gstatic.com/` | 404 | preconnect | **false positive** — preconnect origins, not links (the css2 font URL is 200) |
| `brunomorettitattoo.com`, `instagram.com/brunomoretti.tattoo` | 200 | /artists (source) | OK |

---

## Ops / Health
*Kept separate from quality counts — actionable by ops/release.*

- **🔴 Both forms silently drop every submission in production.** `wrangler.toml` has only the `ASSETS` binding active — `DB` (D1), `LEADS_KV`, and `RESEND_*` are all commented out. In `lead.ts` the no-binding path falls through to `console.log` and returns `{ok:true}`, so the homepage newsletter form **and** the `/artists/apply` artist application both show "success" while **persisting nothing and emailing no one**. Provision `LEADS_KV` (or D1) + `RESEND_API_KEY`/`RESEND_FROM_EMAIL`/`LEAD_NOTIFY_EMAIL` and uncomment the bindings before relying on either form. *(`/api/lead` itself is live — GET returns 405 as designed.)*
- **🟠 Release process is behind `master`.** The stale deploy (SW1) implies Workers Builds isn't auto-deploying pushes (or the last manual `wrangler deploy` predates `d6f5df4`). Wire/verify the auto-deploy trigger.

---

## Fix First
*Highest leverage first. Root-cause fixes that clear multiple findings lead.*

1. **Fix source, then redeploy `master` as one release.** In the same branch, before deploying: create `public/assets/og-image.png` 1200×630 (**SW3**), reconcile `StyleGallery` heading vs 4 cards (**H3**), and set the three real app URLs or a "coming soon" state (**SW2**). Then deploy. This one release clears SW1 (404s + stale copy + incomplete sitemap), SW3, SW2, and H3 together.
2. **Make the conversion funnel actually work.** Provision Cloudflare bindings (KV/D1 + Resend) so the forms capture leads (**Ops blocker**); confirm the app/web URLs from step 1 resolve.
3. **Turn off the Cloudflare AI Crawl Control / Content-Signals managed robots.txt** so it stops contradicting the site's GEO policy (**SW4**) — a dashboard toggle.
4. **Remove the trust/legal landmines:** fabricated testimonial (**SW7**), "first"/"trusted by masters" claims (**SW8/H5**), legal-contact email domain (**L1**), and the processor-disclosure gap (**L2**).
5. **A11y + perf polish:** lift the low-contrast text ramp (**SW5**), optimize the hero/gallery images to fix LCP (**H1**), make `#style-rail` keyboard-accessible (**H2**), fix the malformed legal `<dl>`s, and ship the `/artists` source a11y fixes (**AR1-2**) with the redeploy.
6. **Low-effort copy/legal cleanup:** governing law (**L4**), cookie disclosure (**L5**), licence→license (**L6**), leaked impl detail (**L7**), trailing-slash hrefs (**SW6**), topographic (**H6**), keywords brand (**SW9**).

---

*Artifacts: `findings.json` (machine-readable, with `file:line` + source pointers), `screenshots/` (desktop+mobile per page), `discover-report.json`, `links.txt`, `headers.txt`, `lighthouse/home.json`, `render/*.json`. Re-run this audit after the redeploy to confirm the 404s, sitemap, and stale copy are cleared.*
