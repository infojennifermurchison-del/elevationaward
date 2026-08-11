/**
 * One-time import of the legacy RISEhigHER Elevation Award data (exported from
 * the previous host) into the local SQLite database + upload folder.
 *
 * Usage:
 *   HANDOFF_DIR=/path/to/RISEhigHER_Elevation_Award_Complete_Handoff \
 *   DATA_DIR=./data \
 *   FORCE=1 \
 *   npx tsx tools/import-legacy-data.ts
 *
 * - HANDOFF_DIR must contain `data/` (JSON exports) and `application-documents/`.
 * - Reconstructs user accounts from the applications export (no passwords — each
 *   person sets one via the app, and the ADMIN_EMAIL account is promoted on boot).
 * - Preserves original row IDs so file/budget relationships stay intact.
 * - Copies each uploaded PDF to the upload folder under its storage key.
 */
import fs from "node:fs";
import path from "node:path";
import { ENV } from "../server/_core/env";
import { ensureSchema, getRawDb } from "../server/db";

const HANDOFF = process.env.HANDOFF_DIR;
if (!HANDOFF) {
  console.error("Set HANDOFF_DIR to the extracted handoff folder.");
  process.exit(1);
}
const dataRoot = path.join(HANDOFF, "data");
const docsRoot = path.join(HANDOFF, "application-documents");

const readJson = (name: string): any[] => {
  const p = path.join(dataRoot, name);
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, "utf8"));
};

const toSec = (iso: unknown): number | null =>
  typeof iso === "string" && iso ? Math.floor(Date.parse(iso) / 1000) : null;
const nowSec = () => Math.floor(Date.now() / 1000);
const b = (v: unknown): number => (v ? 1 : 0);

ensureSchema();
const db = getRawDb();

const applications = readJson("applications.json");
const budgets = readJson("budget_items.json");
const files = readJson("uploaded_files.json");
const settings = readJson("site_settings.json");

// Guard against double-import.
const existing = db.prepare("SELECT COUNT(*) AS n FROM applications").get() as { n: number };
if (existing.n > 0 && process.env.FORCE !== "1") {
  console.error(
    `Database already has ${existing.n} applications. Re-run with FORCE=1 to wipe and re-import.`,
  );
  process.exit(1);
}
if (process.env.FORCE === "1") {
  for (const t of [
    "users",
    "applications",
    "budget_items",
    "uploaded_files",
    "evaluator_invites",
    "evaluator_scores",
    "site_settings",
  ]) {
    db.prepare(`DELETE FROM ${t}`).run();
  }
}

// ── Users (reconstructed from applications) ──────────────────────────────────
const usersById = new Map<number, { email: string | null; name: string | null }>();
for (const a of applications) {
  if (!usersById.has(a.userId)) {
    usersById.set(a.userId, { email: a.accountEmail ?? null, name: a.accountName ?? null });
  }
}
const insUser = db.prepare(
  `INSERT INTO users (id, openId, name, email, loginMethod, passwordHash, role, createdAt, updatedAt, lastSignedIn)
   VALUES (@id, @openId, @name, @email, NULL, NULL, 'user', @ts, @ts, @ts)`,
);
for (const [id, u] of usersById) {
  insUser.run({ id, openId: `imported:${id}`, name: u.name, email: u.email, ts: nowSec() });
}

// ── Applications ─────────────────────────────────────────────────────────────
const appCols = [
  "id", "userId", "status", "legalBusinessName", "dba", "entityType", "entityTypeOther",
  "stateOfRegistration", "dateOfFormation", "businessAddress", "repName", "repTitle",
  "email", "phone", "businessDescription", "certMember", "certRegistered", "certBankAccount",
  "certNetProfit", "certNoW2", "certBusinessPlan", "customerImpactNarrative", "operatingHistory",
  "founderNarrative", "operationMode", "ninetyDayImpact", "certAccuracy", "certAgreement",
  "certConsent", "certW9", "signatureName", "signatureDate", "submittedAt", "createdAt", "updatedAt",
];
const boolCols = new Set([
  "certMember", "certRegistered", "certBankAccount", "certNetProfit", "certNoW2",
  "certBusinessPlan", "certAccuracy", "certAgreement", "certConsent", "certW9",
]);
const tsCols = new Set(["submittedAt", "createdAt", "updatedAt"]);
const insApp = db.prepare(
  `INSERT INTO applications (${appCols.join(", ")}) VALUES (${appCols.map((c) => "@" + c).join(", ")})`,
);
for (const a of applications) {
  const row: Record<string, unknown> = {};
  for (const c of appCols) {
    if (boolCols.has(c)) row[c] = b(a[c]);
    else if (tsCols.has(c)) row[c] = c === "submittedAt" ? toSec(a[c]) : (toSec(a[c]) ?? nowSec());
    else row[c] = a[c] ?? null;
  }
  insApp.run(row);
}

// ── Budget items ─────────────────────────────────────────────────────────────
const insBudget = db.prepare(
  `INSERT INTO budget_items (id, applicationId, description, amount, sortOrder)
   VALUES (@id, @applicationId, @description, @amount, @sortOrder)`,
);
for (const bi of budgets) {
  insBudget.run({
    id: bi.id,
    applicationId: bi.applicationId,
    description: bi.description,
    amount: bi.amount,
    sortOrder: bi.sortOrder ?? 0,
  });
}

// ── Uploaded files (+ copy PDFs onto disk) ───────────────────────────────────
const docFolders = fs.existsSync(docsRoot) ? fs.readdirSync(docsRoot) : [];
function findSourcePdf(applicationId: number, fileType: string): string | null {
  const folder = docFolders.find((f) => f.startsWith(`application-${applicationId}-`));
  if (!folder) return null;
  const dir = path.join(docsRoot, folder);
  const file = fs.readdirSync(dir).find((f) => f.startsWith(`${fileType}__`));
  return file ? path.join(dir, file) : null;
}
const insFile = db.prepare(
  `INSERT INTO uploaded_files (id, applicationId, fileType, originalName, storageKey, storageUrl, uploadedAt)
   VALUES (@id, @applicationId, @fileType, @originalName, @storageKey, @storageUrl, @uploadedAt)`,
);
fs.mkdirSync(ENV.uploadDir, { recursive: true });
let copied = 0;
let missing = 0;
for (const f of files) {
  insFile.run({
    id: f.id,
    applicationId: f.applicationId,
    fileType: f.fileType,
    originalName: f.originalName,
    storageKey: f.storageKey,
    storageUrl: f.storageUrl,
    uploadedAt: toSec(f.uploadedAt) ?? nowSec(),
  });
  const src = findSourcePdf(f.applicationId, f.fileType);
  if (!src) {
    console.warn(`  ! No source PDF for app ${f.applicationId} / ${f.fileType}`);
    missing++;
    continue;
  }
  const dest = path.join(ENV.uploadDir, f.storageKey.replace(/^\/+/, ""));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  copied++;
}

// ── Site settings ────────────────────────────────────────────────────────────
const s = settings[0];
if (s) {
  db.prepare(
    `INSERT INTO site_settings (id, announcementEnabled, announcementBusinessName, announcementMessage, updatedAt)
     VALUES (1, @en, @bn, @msg, @ts)`,
  ).run({
    en: b(s.announcementEnabled),
    bn: s.announcementBusinessName ?? null,
    msg: s.announcementMessage ?? null,
    ts: toSec(s.updatedAt) ?? nowSec(),
  });
}

console.log(
  `Imported: ${usersById.size} users, ${applications.length} applications, ` +
    `${budgets.length} budget items, ${files.length} file records ` +
    `(${copied} PDFs copied, ${missing} missing), ${settings.length ? 1 : 0} settings row.`,
);
console.log(`Database: ${ENV.databaseFile}`);
console.log(`Uploads:  ${ENV.uploadDir}`);
