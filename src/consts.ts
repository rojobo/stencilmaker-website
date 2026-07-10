/**
 * Site-wide constants. Single source of truth for SEO, structured data,
 * and metadata. Change once, propagated everywhere.
 */

export const SITE = {
  name: "StencilMaker",
  domain: "thestencilmaker.com",
  url: "https://thestencilmaker.com",
  title: "StencilMaker — AI Tattoo Stencils for Professional Artists",
  tagline: "The Evolution of Tattoo Craft",
  description:
    "StencilMaker is the AI architecture built for the demands of high-end tattoo craft. Upload any reference, get a vector-grade transfer stencil in seconds. Uncompromising precision. Pure lines. Zero noise.",
  shortDescription:
    "AI-powered tattoo stencils. Vector-grade output from any reference image.",
  keywords: [
    "tattoo stencil generator",
    "AI tattoo stencil",
    "tattoo transfer paper",
    "stencilmaker app",
    "AI stencil for tattoo artists",
    "professional tattoo tools",
    "tattoo prep software",
  ],
  ogImage: "/assets/og-image.png", // 1200x630 social card
  twitterHandle: "@stencilmaker",
  locale: "en_US",
  language: "en",
  themeColor: "#0a0a0a",
  accentColor: "#4f46e5",
  appStoreUrl: "https://apps.apple.com/us/app/thestencilmaker/id6768630775",
  playStoreUrl: "https://play.google.com/store/apps/details?id=com.stencilmaker.app", // verified app id (apps/mobile/app.json)
  webAppUrl: "https://app.thestencilmaker.com",
  supportEmail: "support@thestencilmaker.com",
  pressEmail: "press@thestencilmaker.com",
} as const;

/**
 * Pricing — mirrors the shipped app exactly (RevenueCat IAP + Coinbase USDC).
 *   • Free + a single Premium plan billed monthly ($7.99) or yearly ($59.99).
 *   • Pay-as-you-go credit packs (never expire). 1 stencil = 20 credits.
 * Keep Pricing.astro and JsonLd.astro in sync with any change here.
 */
export const PRICING = {
  currency: "USD",
  creditsPerGeneration: 20,
  free: { name: "Free", price: 0 },
  premium: {
    name: "Premium",
    monthly: 7.99,
    yearly: 59.99,
    yearlySavingsPct: 37,
    trialDays: 7,
  },
  credits: {
    starter: { name: "Starter", price: 4.99, credits: 550, bonus: 50 },
    popular: { name: "Popular", price: 9.99, credits: 1100, bonus: 100 },
    pro: { name: "Pro", price: 24.99, credits: 3000, bonus: 500 },
  },
  /**
   * LIMITED-TIME web/crypto promo — LIVE. Credit packs already ship with a
   * standard bonus (+50/+100/+500). Paying with USDC at thestencilmaker.com
   * DOUBLES that bonus — same dollar price, twice the bonus credits. Structured
   * as bonus credits (not a price cut) so it never undercuts the App Store /
   * Google Play *price* (clear of Apple/Google anti-steering rules) while still
   * being a real "more bang for your buck" offer.
   *
   * Effective per pack (base + bonusMultiplier × standard bonus):
   *   Starter  $4.99 → +100 bonus →   600 credits
   *   Popular  $9.99 → +200 bonus → 1,200 credits
   *   Pro     $24.99 → +1,000 bonus → 3,500 credits
   *
   * SINGLE SOURCE OF TRUTH for the offer shown on the site. The app grants the
   * doubled bonus only while STENCIL_USDC_DOUBLE_BONUS=true (confirmed live in
   * production):
   *   StencilMaker/apps/api/.../models/credit.py — IAP_CREDIT_PACK_CATALOG +
   *     coinbase_variant(double_bonus=…) doubles the bonus (×2 multiplier)
   *   StencilMaker/apps/api/.../config.py — Settings.usdc_double_bonus flag
   * When the promo ends the app flag is flipped off AND this must be reverted
   * to bonusMultiplier: 1 / limitedTime: false so the site stops advertising it.
   */
  web: {
    method: "USDC",
    bonusMultiplier: 2,
    limitedTime: true,
  },
} as const;

/**
 * Featured / sponsored artist — single source of truth for BOTH the homepage
 * SponsoredArtist spotlight and the /artists feature page. Keep both in sync by
 * editing here only.
 *
 * SOURCE: All factual copy is drawn from the artist's own website
 * (brunomorettitattoo.com) and public profiles. Fields prefixed `quote*` are
 * VERBATIM quotes from his site — do not paraphrase them. Portfolio images in
 * `works` are self-hosted under /gallery/bruno/ courtesy of his site (he is a
 * paid partner). We do NOT claim he personally uses StencilMaker; the product
 * tie-in is framed only around his documented reference-driven, composition-
 * first, large-scale workflow.
 */
export const SPONSORED_ARTIST = {
  slug: "bruno-moretti",
  name: "Bruno Moretti",
  flag: "🇦🇷",
  role: "Black & Grey · Dark Realism",
  motto: "Strange & Cursed", // his Instagram descriptor
  siteTagline: "Dark Art Tattoo — Denver",
  studio: "Long Live Tattoo Collective",
  studioMeta: "LONG LIVE TATTOO COLLECTIVE // DENVER",
  location: "Denver, Colorado",
  origin: "Neuquén, Patagonia, Argentina",
  since: 2010,
  ink: "Radiant Colors",
  followers: "~19K",
  portrait: "/gallery/bruno-moretti.jpg",
  portraitAlt:
    "Bruno Moretti seated among his framed dark-art prints, holding a bottle of Radiant tattoo ink",

  // Homepage spotlight lead (short).
  bioLead:
    "Patagonia-born, Denver-based — tattooing since 2010. Large-scale black-and-grey where realism bleeds into the surreal, terror, and horror.",

  // VERBATIM quotes from brunomorettitattoo.com.
  quoteShort:
    "After more than a decade, I still work with the same passion as when I started.",
  quoteIntro:
    "I'm Bruno Moretti, born in Neuquén, in the south of Patagonia Argentina. I started my career as a tattoo artist in 2010, and after more than a decade, I still work with the same passion as when I started. I am now living in the United States, specifically in Denver, Colorado, where I continue to develop my craft and explore new possibilities in the world of black and grey — a style that allows me to blend influences of dark, surreal, terror, and horror.",
  quoteCraft:
    "My work is based on a constant search. I don't have a completely defined style, because what truly excites me is the composition of the tattoo and how it interacts with the body.",
  quoteRange:
    "My expressive search is primarily based on a deep study of black and grey — exploring from the purest light and beauty to the depths of the dark and decadent.",

  tags: [
    "Black & Grey",
    "Dark Realism",
    "Surreal Horror",
    "Freehand",
    "Large-Scale",
  ],

  // Spec-sheet "credits" block on the feature page.
  credits: [
    { label: "Origin", value: "Neuquén, Patagonia 🇦🇷" },
    { label: "Based", value: "Denver, Colorado" },
    { label: "Tattooing since", value: "2010" },
    { label: "Resident", value: "Long Live Tattoo Collective" },
    { label: "Ink partner", value: "Radiant Colors" },
    { label: "Method", value: "Freehand · multi-session" },
  ],

  // Selected works — self-hosted from his portfolio. Captions are descriptive
  // (his galleries are untitled), grouped by the two poles he organizes his own
  // portfolio around: Realism and Dark Art.
  works: [
    {
      src: "/gallery/bruno/realism-1.jpg",
      set: "Realism",
      caption: "Veiled portrait",
      alt: "Black & grey realism tattoo — a woman's veiled face rendered in soft tonal shading across the shoulder",
    },
    {
      src: "/gallery/bruno/realism-2.jpg",
      set: "Realism",
      caption: "The mask",
      alt: "Black & grey horror realism tattoo — a cinematic masked figure portrait on the upper arm",
    },
    {
      src: "/gallery/bruno/darkart-1.jpg",
      set: "Dark Art",
      caption: "Ossuary",
      alt: "Dark-art bio-organic tattoo sleeve — skeletal, thorned forms in high-contrast black & grey",
    },
    {
      src: "/gallery/bruno/darkart-2.jpg",
      set: "Dark Art",
      caption: "Spectres",
      alt: "Dark surreal black & grey tattoo across the neck and back — spectral faces emerging from smoke",
    },
  ],

  links: {
    website: "https://www.brunomorettitattoo.com",
    portfolio: "https://www.brunomorettitattoo.com/portfolio",
    instagram: "https://www.instagram.com/brunomoretti.tattoo/",
    instagramHandle: "@brunomoretti.tattoo",
    booking: "https://www.brunomorettitattoo.com/contact",
    podcast: "https://www.youtube.com/@innormales",
  },
} as const;
