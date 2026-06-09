# StencilMaker Marketing Site

The public-facing marketing site for **StencilMaker** — AI-powered tattoo
stencils for professional artists. Static-first Astro app deployed to
**Cloudflare Workers** (Static Assets) with a single dynamic Worker route
(`/api/lead`) for lead capture.

| Layer            | Choice                                              |
| ---------------- | --------------------------------------------------- |
| Framework        | [Astro 5](https://astro.build/) (server output)     |
| Styling          | [Tailwind v4](https://tailwindcss.com/) (CSS-first) |
| Icons            | [Phosphor Icons](https://phosphoricons.com/) (SRI)  |
| Fonts            | Syne + Manrope (Google Fonts, swap)                 |
| Hosting          | [Cloudflare Workers](https://developers.cloudflare.com/workers/static-assets/) (Static Assets) |
| Runtime          | Cloudflare Workers (via `@astrojs/cloudflare`)      |
| Lead storage     | Cloudflare D1 (with KV fallback)                    |
| Anti-bot         | Cloudflare Turnstile                                |
| Transactional    | Resend                                              |
| Analytics        | Cloudflare Web Analytics (cookieless)               |

---

## Prerequisites

- **Node.js 22 LTS** or newer (use `nvm use` — see `.nvmrc`).
- **pnpm 10** (`corepack enable && corepack prepare pnpm@10 --activate`).
- A Cloudflare account (free tier is enough for launch).

---

## Local development

```bash
# Install dependencies (once)
pnpm install

# Start the dev server at http://localhost:4321
pnpm dev

# Type-check + diagnostics across all .astro / .ts files
pnpm check

# Production build (outputs to ./dist)
pnpm build

# Build + run the Cloudflare Workers emulator (`wrangler dev`)
pnpm preview:cf
```

The dev server has HMR and reloads on file changes. The `preview:cf` script
is the closest match to production — it runs the built `_worker.js` under
`wrangler dev`, with Cloudflare runtime APIs and bindings emulated locally.
Local runtime secrets for that emulator come from a gitignored `.dev.vars`
file (not `.env`); see `DEPLOY-CLOUDFLARE.md` §4.

---

## Project structure

```text
.
├── astro.config.mjs      # Astro + Cloudflare adapter + Tailwind v4 + sitemap
├── wrangler.toml         # Cloudflare Workers (Static Assets) config + binding stubs
├── tsconfig.json         # Strict TS, path aliases (@components, @layouts, …)
├── public/               # Files served verbatim at site root
│   ├── _headers          # Security headers, CSP, cache policy
│   ├── _redirects        # 301 redirects (legacy /site.html, etc.)
│   ├── robots.txt        # Crawler policy (allows GEO bots)
│   ├── llms.txt          # Plain-text product brief for AI engines
│   ├── site.webmanifest  # PWA manifest
│   ├── .well-known/      # security.txt
│   ├── assets/           # Brand graphics
│   └── gallery/          # Stencil sample images
├── src/
│   ├── consts.ts         # Single source of truth for SEO + pricing
│   ├── env.d.ts          # Cloudflare runtime + binding types
│   ├── styles/global.css # Tailwind @theme + custom utilities
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── components/       # SEO, JsonLd, Nav, Hero, Pricing, LeadForm, …
│   └── pages/
│       ├── index.astro   # Marketing landing page (prerendered)
│       └── api/lead.ts   # POST /api/lead — SSR route on the Cloudflare Worker
└── dist/                 # Build output (gitignored)
```

---

## Next steps

- **Audit + roadmap:** [`LIBRARIES-AUDIT.md`](./LIBRARIES-AUDIT.md) lists
  every library/vendor a 2026 marketing site needs and what's still missing.
- **Deploy:** [`DEPLOY-CLOUDFLARE.md`](./DEPLOY-CLOUDFLARE.md) is the
  step-by-step from `git push` → custom domain → live lead capture.
