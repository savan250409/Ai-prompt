/**
 * Central, env-driven configuration — §1, §4, §13.
 * Every cost/grant/flag is overridable via env so the owner can re-tune with no
 * code change. Read this on the SERVER for entitlement math; a safe public subset
 * is exposed to the client via `publicConfig`.
 */

const int = (v: string | undefined, fallback: number): number => {
  const n = Number.parseInt(v ?? "", 10);
  return Number.isFinite(n) ? n : fallback;
};

export const config = {
  // ---- data source -------------------------------------------------------
  databaseUrl: process.env.DATABASE_URL ?? "",
  existingApiBaseUrl: process.env.EXISTING_API_BASE_URL ?? "",

  // ---- upstream catalog API (aivibecode) — §1.1 Approach A --------------
  // When set, image/video/filter content is read LIVE from this API instead of
  // a local DB or mock. Token is server-side only (never shipped to client).
  api: {
    baseUrl: (process.env.CATALOG_API_BASE_URL ?? "").replace(/\/+$/, ""),
    token: process.env.CATALOG_API_TOKEN ?? "",
    get enabled() {
      return Boolean(this.baseUrl && this.token);
    },
  },

  /** When no API, no DB and no upstream API are configured, render from seed. */
  get useMockCatalog() {
    return !this.api.enabled && !this.databaseUrl && !this.existingApiBaseUrl;
  },
  /**
   * The web store (users / coins / favorites / generations) uses Prisma ONLY
   * when explicitly enabled with WEB_STORE=prisma AND a DB is set. This is kept
   * separate from the read-only catalog so pointing DATABASE_URL at a SHARED or
   * legacy DB (e.g. one already owned by another app, with its own users/
   * sessions tables) renders the catalog without forcing the app's own web
   * tables onto it. Enable once the web_* tables have been created (db push).
   */
  get useDbWebStore() {
    return Boolean(this.databaseUrl) && process.env.WEB_STORE === "prisma";
  },

  // ---- media -------------------------------------------------------------
  mediaBaseUrl: process.env.MEDIA_BASE_URL ?? "",

  // ---- coins (costs to spend) — §1.4 ------------------------------------
  coinCost: {
    video: int(process.env.COIN_COST_VIDEO, 10),
    image: int(process.env.COIN_COST_IMAGE, 5),
    filter: int(process.env.COIN_COST_FILTER, 3),
    tool: int(process.env.COIN_COST_TOOL, 3),
  },

  // ---- plan coin grants — §1.4 ------------------------------------------
  planCoins: {
    weekly: int(process.env.PLAN_COINS_WEEKLY, 50),
    monthly: int(process.env.PLAN_COINS_MONTHLY, 150),
    yearly: int(process.env.PLAN_COINS_YEARLY, 1200),
  },

  // ---- plan prices (INR rupees; Cashfree uses major units) — §6 ---------
  planPriceInr: {
    weekly: int(process.env.PLAN_PRICE_WEEKLY, 49),
    monthly: int(process.env.PLAN_PRICE_MONTHLY, 149),
    yearly: int(process.env.PLAN_PRICE_YEARLY, 1199),
  },

  // ---- free unlock quota — §1.5 -----------------------------------------
  freeUnlocksPerDay: int(process.env.FREE_UNLOCKS_PER_DAY, 3),

  // ---- generation rate limit (per user / minute) — §10 ------------------
  generationRatePerMin: int(process.env.GENERATION_RATE_PER_MIN, 12),

  // ---- Runware (server-side only) — §7a ---------------------------------
  runware: {
    apiKey: process.env.RUNWARE_API_KEY ?? "",
    apiUrl: process.env.RUNWARE_API_URL ?? "https://api.runware.ai/v1",
    wsUrl: process.env.RUNWARE_WS_URL ?? "wss://ws-api.runware.ai/v1",
    webhookSecret: process.env.RUNWARE_WEBHOOK_SECRET ?? "",
    model: {
      image: process.env.RUNWARE_MODEL_IMAGE ?? "placeholder:image@1",
      video: process.env.RUNWARE_MODEL_VIDEO ?? "placeholder:video@1",
    },
    /** Use the real provider only when a key is present; else Mock. */
    get enabled() {
      return Boolean(this.apiKey);
    },
  },

  // ---- generation toggles -> model capability mapping — §7a caveat ------
  // Kept as config so swapping in the real model needs no code change.
  video: {
    durations: [6, 12] as const,
    resolutions: [480, 720] as const,
    defaultDuration: int(process.env.VIDEO_DEFAULT_DURATION, 6),
    defaultResolution: int(process.env.VIDEO_DEFAULT_RESOLUTION, 480),
  },

  // ---- Cashfree (payments, INR) — §1.6 ----------------------------------
  cashfree: {
    appId: process.env.CASHFREE_APP_ID ?? "",
    secretKey: process.env.CASHFREE_SECRET_KEY ?? "",
    env: (process.env.CASHFREE_ENV ?? "sandbox") === "production" ? "production" : "sandbox",
    apiVersion: process.env.CASHFREE_API_VERSION ?? "2023-08-01",
    /** Default phone for order creation (Cashfree requires one). */
    defaultPhone: process.env.CASHFREE_DEFAULT_PHONE ?? "9999999999",
    get baseUrl() {
      return this.env === "production"
        ? "https://api.cashfree.com/pg"
        : "https://sandbox.cashfree.com/pg";
    },
    get enabled() {
      return Boolean(this.appId && this.secretKey);
    },
  },

  // ---- auth --------------------------------------------------------------
  googleEnabled: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),

  // ---- environment flags -------------------------------------------------
  isProd: process.env.NODE_ENV === "production",
  /** Dev-only simulated purchase; force-disabled in production — §1.6. */
  get devBillingTestMode() {
    return !this.isProd && !this.cashfree.enabled;
  },
} as const;

/** Plan metadata used by /pricing and billing. */
export const PLANS = [
  {
    id: "weekly" as const,
    name: "Weekly",
    priceInr: config.planPriceInr.weekly,
    coins: config.planCoins.weekly,
    cadence: "week",
    badge: null as string | null,
  },
  {
    id: "monthly" as const,
    name: "Monthly",
    priceInr: config.planPriceInr.monthly,
    coins: config.planCoins.monthly,
    cadence: "month",
    badge: "MOST POPULAR" as string | null,
  },
  {
    id: "yearly" as const,
    name: "Yearly",
    priceInr: config.planPriceInr.yearly,
    coins: config.planCoins.yearly,
    cadence: "year",
    badge: "BEST VALUE" as string | null,
  },
];

export type PlanId = (typeof PLANS)[number]["id"];

/** Safe subset shipped to the browser (NO secrets). */
export const publicConfig = {
  coinCost: config.coinCost,
  freeUnlocksPerDay: config.freeUnlocksPerDay,
  video: config.video,
  devBillingTestMode: config.devBillingTestMode,
  cashfreeMode: config.cashfree.env, // public: the Cashfree JS SDK needs the mode (no secret)
};

export type PublicConfig = typeof publicConfig;
