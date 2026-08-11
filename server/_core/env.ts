import path from "node:path";

// Resolve the runtime data directory (SQLite file + uploaded documents live
// here). Defaults to <project>/data. Everything the app needs to persist is
// under this one folder — back it up and you've backed up the whole app.
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve(process.cwd(), "data");

export const ENV = {
  isProduction: process.env.NODE_ENV === "production",

  // Session cookie signing secret (HS256). Set a long random value in prod.
  cookieSecret: process.env.SESSION_SECRET ?? process.env.JWT_SECRET ?? "dev-insecure-secret-change-me",

  // Storage locations
  dataDir: DATA_DIR,
  databaseFile: process.env.DATABASE_FILE
    ? path.resolve(process.env.DATABASE_FILE)
    : path.join(DATA_DIR, "app.db"),
  uploadDir: process.env.UPLOAD_DIR
    ? path.resolve(process.env.UPLOAD_DIR)
    : path.join(DATA_DIR, "uploads"),

  // Bootstrap admin — the app seeds/promotes this account on startup so there
  // is always a way in. Set both to log in as admin.
  adminEmail: (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  adminName: process.env.ADMIN_NAME ?? "Administrator",

  // Optional owner-notification webhook (POSTed JSON on new submissions).
  ownerNotifyWebhook: process.env.OWNER_NOTIFY_WEBHOOK ?? "",

  // Public base URL, used when building invite links, etc. Falls back to the
  // request origin when unset.
  appUrl: (process.env.APP_URL ?? "").replace(/\/+$/, ""),
};
