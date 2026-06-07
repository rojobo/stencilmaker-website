# Fix Report — StencilMaker audit 2026-06-07

**Repo:** `/home/bryan/StencilMakerWebsite` · **Branch:** `fix/audit-2026-06-07` (3 commits) · **Build:** ✅ green (`npm run build`, all 5 pages prerender, sitemap regenerated)
**Verification:** changed routes re-rendered against a local served `dist/` (DOM + axe). Per-fix served-output checks all pass; perf/LCP confirmation is **post-deploy** (local static server ≠ CDN).

## Outcome at a glance

| Disposition | Count | Findings |
|---|---|---|
| ✅ fixed (mechanical) | 10 | SW6, SW8, SW9, H2, H3, H6, L1, L4, L6, L7 |
| ✅ fixed (gray-area, your call) | 3 | SW7, H5, SW2-context |
| ✅ fixed (AI-drafted — review) | 3 | L2, L5, H4 |
| ✅ fixed (assets/perf) | 2 | SW3, H1 |
| ✅ already-resolved (FP) | 1 | AR1 |
| ⏸️ deferred-manual | 9 | SW5, A3, SW2, L3, L8, L9, AR2, AR3, AR4 |
| ⚙️ needs-operator | 4 | SW1, SW4, OPS-1, OPS-2 |

## Commits
- `e549693` fix(content+seo+a11y): drop 'first' claim, style-gallery count + keyboard access, remove fabricated testimonial, FAQ caveat, trailing-slash links, brand keyword `[SW6,SW7,SW8,SW9,H2,H3,H4,H5,H6]`
- `96d279e` fix(legal): governing law→Delaware, license spelling, processor+cookie disclosure, contact-email domain, drop impl detail `[L1,L2,L4,L5,L6,L7]`
- `e9dd85a` perf(images): optimize hero+gallery (−2.6 MB), add 1200×630 og-image `[H1,SW3]`

---

## Fixed — verified in the served output

| ID | What changed | Verified |
|---|---|---|
| SW3 | Created `public/assets/og-image.png` (1200×630, 90 KB, brand logo on obsidian). `og:image` now resolves on every page. | dist has the file; `og:image` meta points to it |
| SW7+H5 | Removed the `<SocialProof />` section (fabricated "Elias Thorne" stock-photo testimonial **and** the unsubstantiated "TRUSTED BY MASTERS" marquee). | dist homepage: `Elias Thorne`=0, `unsplash`=0, `TRUSTED BY MASTERS`=0 |
| SW8 | Dropped the unprovable "**first** AI architecture/tool" in `consts.ts`, `Hero.astro`, `public/llms.txt`. | dist homepage: `first AI`=0 |
| SW9 | Keywords `"stencil maker app"` → `"stencilmaker app"`. | source |
| SW6 | Trailing-slash internal links (Footer `/privacy//terms//artists/`; privacy↔terms cross-links). | dist homepage shows `/privacy/ /terms/ /artists/` |
| H1 | Optimized images: **hero-graphic-light.png 2333→691 KB (−70%, the LCP element)**, gallery JPGs −64% each, sm-upscaled* 2048→1600w. ~2.6 MB saved on disk. Gallery PNGs already well-compressed were left untouched by the no-regression gate. | `fixes/image-optim-report.json`; dist hero = 692 KB. **LCP delta confirm post-deploy.** |
| H2 | `#style-rail` now `tabindex="0"` + `role="region"` + `aria-label`. | axe re-render: `scrollable-region-focusable` **gone** from homepage |
| H3 | StyleGallery heading "10 Distinct Vocabularies." → **"Four Distinct Vocabularies."** (your call: match the 4 cards). | dist homepage |
| H4 | FAQ JSON-LD now says "up to 10 stencils per day (5/day monthly, 10/day annual)". | dist homepage |
| H6 | "topographical" → "topographic" (StyleGallery). | dist homepage |
| L1 | Legal-contact emails → `privacy@thestencilmaker.com` / `legal@thestencilmaker.com` (your call). | dist privacy/terms: `.app`=0, `.com`=2 each |
| L2 | Added **Cloudflare** + **Resend** to the sub-processor table (code-verified usage). *AI-drafted — review with counsel.* | dist privacy: Cloudflare/Resend present |
| L4 | Governing law "laws of the United States" → "laws of the State of Delaware" (matches venue), both prose + facts. | dist terms: US-law=0, Delaware=1 |
| L5 | Added a cookieless-analytics disclosure to "what we collect". *AI-drafted — review with counsel.* | dist privacy: disclosure present |
| L6 | "licence" → "license". | dist terms: `licence`=0 |
| L7 | Removed leaked "prompt template is assembled server-side" implementation detail. | dist terms: `assembled server-side`=0 |
| AR1 | **Already resolved** — the artists.astro marquee `<h2>` is already inside an `aria-hidden="true"` wrapper. The source-review flag was a false positive. | source (no edit) |

---

## Deferred — manual follow-up (with reason)

| ID | Sev | Why deferred | Recommended action |
|---|---|---|---|
| SW2 | 🔴 | **You chose "leave as-is."** All 3 app CTAs are still dead (App Store 404, Play 404, `app.thestencilmaker.com` NXDOMAIN). | Before launch: supply real URLs in `consts.ts:31-33` **or** swap the CTAs for a working "coming soon" / email-capture state. |
| SW5 | 🟠 | Color-contrast is a **design-token decision**, not a mechanical swap. axe still reports it (22/16/35/43 nodes). | Lift the low end of the neutral text ramp (e.g. `text-neutral-500`→`-400`) and verify the indigo `text-stencil` accent ≥4.5:1 on obsidian; re-run axe. |
| A3 | 🟡 | The privacy/terms `<dl>`/`<dt>`/`<dd>` structure is malformed (axe `definition-list`/`dlitem`). Restructuring legal markup is risky to do blind. *Note: the L2/L5 additions added 2 `dlitem` nodes to the existing malformed lists — same defect class, more instances.* | Wrap each dt/dd pair correctly (dt+dd as direct children of one `<dl>`, or use `<div>` wrappers per the spec) on both legal pages. |
| L3 | 🟡 | "Meta / Instagram" is listed as a sign-in provider; can't confirm it's implemented (app-side). | Confirm Meta sign-in exists; if not, remove it from `privacy.astro:45`. |
| L8 | ⚪ | Needs the **real legal entity name** — can't fabricate. | Name the contracting entity (e.g. "StencilMaker Inc., a Delaware corporation") at the top of both legal docs. |
| L9 | ⚪ | Needs the **real refund policy** — can't fabricate. | Add a refund/non-refundability clause (store policies for IAP; USDC packs non-refundable on-chain). |
| AR2/AR3/AR4 | ⚪/🟡 | Low-severity polish on the **not-yet-live** artist pages (form ARIA, og:image:alt, quote attribution). | Address when iterating on `/artists*` post-deploy. |

---

## Needs-operator (infra/config — not code)

- **OPS-1 🔴 — Forms silently drop submissions.** `wrangler.toml` has only the `ASSETS` binding; `DB`/`LEADS_KV`/`RESEND_*` are commented out, so both the newsletter and artist-application forms return `{ok:true}` while persisting/emailing nothing. Provision a KV (or D1) namespace + `RESEND_API_KEY`/`RESEND_FROM_EMAIL`/`LEAD_NOTIFY_EMAIL`, then uncomment the bindings. (`wrangler secret put …` / dashboard — operator action.)
- **SW4 🟠 — Cloudflare managed robots.txt fights the GEO policy.** A dashboard feature (AI Crawl Control / Content Signals) injects `Disallow: /` for ClaudeBot/GPTBot/Google-Extended/etc. + `ai-train=no`, contradicting the repo robots.txt + SEO meta + llms.txt. Toggle it off in the Cloudflare dashboard (or flip the repo policy to match).
- **SW1 🔴 / OPS-2 🟠 — Stale deploy / release process.** This branch contains all the source fixes; **deploying it resolves SW1** (the artist pages 404, the stale homepage copy, and the incomplete sitemap all clear on the next deploy). Verify Workers Builds auto-deploys `master` going forward.

---

## Launch-readiness verdict: **NOT READY** — 3 gates remain

1. **Deploy this branch** → ships the artist pages (kills the homepage 404 links), the complete sitemap, fresh copy, the OG card, and the optimized images. (Hand off to `spiel-deploy-website` or `npm run deploy`.)
2. **OPS-1** — wire up form storage + email, or both lead forms keep dropping submissions.
3. **SW2** — the app-download CTAs are still dead; supply real URLs or a coming-soon state.

Then close the quality follow-ups: **SW4** (CF robots toggle), **SW5** (contrast), **A3** (legal `<dl>`), and the legal review items (**L2/L5** drafted text, **L8/L9** entity/refund).

> Deploy is a separate, deliberate act — this skill stops at a verified, committed branch. To ship: `spiel-deploy-website` (or `npm run deploy`). Do not merge/deploy automatically.
