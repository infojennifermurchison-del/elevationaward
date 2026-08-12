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

      try {
        fs.mkdirSync(ENV.dataDir, { recursive: true });
        const tmp = path.join(ENV.dataDir, `.restore-${Date.now()}.tar.gz`);
        fs.writeFileSync(tmp, body);

        // GNU tar strips leading "/" and refuses ".." members, so extracting a
        // trusted admin-provided archive into the data dir is safe.
        const result = spawnSync("tar", ["-xzf", tmp, "-C", ENV.dataDir], {
          encoding: "utf8",
        });
        fs.rmSync(tmp, { force: true });

        if (result.status !== 0) {
          res.status(500).json({
            error: `Extract failed: ${result.stderr || `tar exit ${result.status}`}`,
          });
          return;
        }

        // Remove stale WAL side-files so the restored db opens cleanly on boot.
        for (const f of ["app.db-wal", "app.db-shm"]) {
          fs.rmSync(path.join(ENV.dataDir, f), { force: true });
        }

        res.json({ success: true, restarting: true });
        // Exit so the platform restarts us against the restored database.
        setTimeout(() => process.exit(0), 750);
      } catch (err) {
        res.status(500).json({ error: String(err) });
      }
    },
  );
}
