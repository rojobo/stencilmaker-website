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
    "StencilMaker is the first AI architecture built for the demands of high-end tattoo craft. Upload any reference, get a vector-grade transfer stencil in seconds. Uncompromising precision. Pure lines. Zero noise.",
  shortDescription:
    "AI-powered tattoo stencils. Vector-grade output from any reference image.",
  keywords: [
    "tattoo stencil generator",
    "AI tattoo stencil",
    "tattoo transfer paper",
    "stencil maker app",
    "AI stencil for tattoo artists",
    "professional tattoo tools",
    "tattoo prep software",
  ],
  ogImage: "/assets/og-image.png", // TODO: generate 1200x630 OG card
  twitterHandle: "@stencilmaker",
  locale: "en_US",
  language: "en",
  themeColor: "#0a0a0a",
  accentColor: "#4f46e5",
  appStoreUrl: "https://apps.apple.com/app/stencilmaker", // TODO confirm
  playStoreUrl: "https://play.google.com/store/apps/details?id=com.stencilmaker", // TODO confirm
  webAppUrl: "https://app.thestencilmaker.com", // TODO confirm
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
} as const;
