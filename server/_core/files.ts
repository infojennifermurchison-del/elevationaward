import type { Express, Request, Response } from "express";
import fs from "node:fs";
import { authenticateRequest } from "./session";
import { getApplicationById, getUploadedFileByKey } from "../db";
import { resolveStoragePath } from "../storage";

// Serves uploaded documents from local disk with access control. These files
// are confidential applicant records (formation docs, bank letters, financials,
// business plans), so only an admin or the application's own owner may read
// them. Evaluators deliberately never receive document access.
export function registerFileRoutes(app: Express) {
  app.get("/manus-storage/*", async (req: Request, res: Response) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    // Identify the requesting user (admins and owners only).
    const user = await authenticateRequest(req).catch(() => null);
    if (!user) {
      res.status(401).send("Sign in required");
      return;
    }

    const fileRow = await getUploadedFileByKey(key);
    if (!fileRow) {
      res.status(404).send("Not found");
      return;
    }

    if (user.role !== "admin") {
      const application = await getApplicationById(fileRow.applicationId);
      if (!application || application.userId !== user.id) {
        res.status(403).send("Forbidden");
        return;
      }
    }

    let absPath: string;
    try {
      absPath = resolveStoragePath(key);
    } catch {
      res.status(400).send("Invalid storage key");
      return;
    }

    if (!fs.existsSync(absPath)) {
      res.status(404).send("File missing on disk");
      return;
    }

    res.set("Cache-Control", "private, no-store");
    res.set("Content-Type", "application/pdf");
    res.set(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(fileRow.originalName)}"`,
    );
    fs.createReadStream(absPath).pipe(res);
  });
}
