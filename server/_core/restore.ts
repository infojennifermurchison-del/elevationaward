import express, { type Express, type Request, type Response } from "express";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { ENV } from "./env";
import { authenticateRequest } from "./session";

// Admin-only "restore from backup" endpoint. Accepts a gzipped tar of the data
// directory (app.db + uploads/, as produced by tools/backup-data.sh or the
// legacy-data import) and extracts it over DATA_DIR, then exits so the platform
// restarts the process and reopens the restored database. Used both for the
// one-time legacy-data load and for future backup restores.
export function registerRestoreRoute(app: Express) {
  app.put(
    "/api/admin/restore",
    express.raw({ type: () => true, limit: "512mb" }),
    async (req: Request, res: Response) => {
      const user = await authenticateRequest(req).catch(() => null);
      if (!user) {
        res.status(401).json({ error: "Sign in required" });
        return;
      }
      if (user.role !== "admin") {
        res.status(403).json({ error: "Admin access required" });
        return;
      }

      const body = req.body as Buffer;
      if (!Buffer.isBuffer(body) || body.length === 0) {
        res.status(400).json({ error: "Empty upload" });
        return;
      }

      const stamp = Date.now();
      const tmp = path.join(ENV.dataDir, `.restore-${stamp}.tar.gz`);
      const work = path.join(ENV.dataDir, `.restore-work-${stamp}`);
      try {
        fs.mkdirSync(ENV.dataDir, { recursive: true });
        fs.writeFileSync(tmp, body);
        fs.mkdirSync(work, { recursive: true });

        // Extract into a work dir the app owns (never the mount point itself,
        // whose permissions the platform may forbid us to change). GNU tar
        // strips leading "/" and refuses ".." members, so this is safe.
        const result = spawnSync(
          "tar",
          ["-xzf", tmp, "-C", work, "--no-same-owner"],
          { encoding: "utf8" },
        );
        if (result.status !== 0) {
          throw new Error(result.stderr || `tar exit ${result.status}`);
        }

        // Move each restored top-level entry into the data dir, replacing.
        for (const entry of fs.readdirSync(work)) {
          const dest = path.join(ENV.dataDir, entry);
          fs.rmSync(dest, { recursive: true, force: true });
          fs.renameSync(path.join(work, entry), dest);
        }
        // Drop any stale journal side-files so the db opens clean on boot.
        for (const f of ["app.db-wal", "app.db-shm", "app.db-journal"]) {
          fs.rmSync(path.join(ENV.dataDir, f), { force: true });
        }

        res.json({ success: true, restarting: true });
        setTimeout(() => process.exit(0), 750);
      } catch (err) {
        res.status(500).json({ error: `Extract failed: ${String(err)}` });
      } finally {
        fs.rmSync(tmp, { force: true });
        fs.rmSync(work, { recursive: true, force: true });
      }
    },
  );
}
