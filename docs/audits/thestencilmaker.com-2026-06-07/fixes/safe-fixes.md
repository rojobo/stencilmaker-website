# Ready-to-apply safe fixes (mechanical, unambiguous)

These are exact find → replace edits. They are **not applied** (audit is report-only). Apply by hand or hand them to `spiel-fix-website-audit`. Judgment calls (testimonial, processor table, app URLs, OG image creation) are intentionally excluded.

### `src/pages/terms.astro` — governing law (L4)
Line 111:
```
-    value: "Laws of the United States",
+    value: "Laws of the State of Delaware",
```
Line 674:
```
-              These Terms are governed by the laws of the United States, and
+              These Terms are governed by the laws of the State of Delaware, and
```

### `src/pages/terms.astro` — spelling (L6)
Line 497:
```
-                licence to process the image solely to produce a stencil.
+                license to process the image solely to produce a stencil.
```

### `src/components/StyleGallery.astro` — copy consistency (H6)
Line 28:
```
-    blurb: "Dense topographical maps for multi-shade wash work.",
+    blurb: "Dense topographic maps for multi-shade wash work.",
```

### `src/consts.ts` — brand consistency in keywords (SW9, cosmetic)
Line 20:
```
-    "stencil maker app",
+    "stencilmaker app",
```

### `src/components/Footer.astro` — trailing-slash hrefs (SW6)
Lines 62-64 (avoids a 307 on every footer click; matches the served canonical):
```
-      <a href="/privacy" class="hover:text-paper transition-colors">Privacy</a>
-      <a href="/terms" class="hover:text-paper transition-colors">Terms</a>
-      <a href="/artists" class="hover:text-paper transition-colors">Artist Directory</a>
+      <a href="/privacy/" class="hover:text-paper transition-colors">Privacy</a>
+      <a href="/terms/" class="hover:text-paper transition-colors">Terms</a>
+      <a href="/artists/" class="hover:text-paper transition-colors">Artist Directory</a>
```
(Also: `src/pages/privacy.astro:199` `href="/terms"` → `/terms/`; `src/pages/terms.astro:189` `href="/privacy"` → `/privacy/`.)

### `src/consts.ts` — OG image STOPGAP only (SW3)
The real fix is to create `public/assets/og-image.png` (1200×630). Until then, stop the 404 by pointing at an existing asset:
```
-  ogImage: "/assets/og-image.png", // TODO: generate 1200x630 OG card
+  ogImage: "/assets/sm-upscaled.png", // STOPGAP until a 1200x630 og-image.png exists
```
(`sm-upscaled.png` is 1.56 MB — a real 1200×630 card is still the correct fix.)

---

## NOT auto-fixable (need a decision / asset / infra change)
- **SW1** redeploy `master` (after H3/SW2/SW3) + verify Workers Builds auto-deploy.
- **SW2** real App Store / Play / Web App URLs, or a "coming soon" state (`consts.ts:31-33`).
- **SW3** create `public/assets/og-image.png` 1200×630.
- **SW4** Cloudflare dashboard: disable AI Crawl Control / Content Signals managed robots.txt.
- **SW7** replace/remove the Elias Thorne testimonial (`SocialProof.astro:19-46`).
- **H3** StyleGallery: restore 6 styles **or** change "10 Distinct Vocabularies." to match 4.
- **L1** decide the legal-contact domain (`@stencilmaker.app` vs `@thestencilmaker.com`).
- **L2** add Cloudflare/Resend/Turnstile/Apple/Google to the processor table.
- **Ops** provision KV/D1 + Resend bindings in `wrangler.toml`.
