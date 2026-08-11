import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import { createServer } from "http";
import net from "net";
import fs from "node:fs";
import { parse as parseCookieHeader } from "cookie";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerFileRoutes } from "./files";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { ENV } from "./env";
import { ensureSchema, getUserByEmail, createUser, upsertUser } from "../db";
import { hashPassword } from "./password";
import { nanoid } from "nanoid";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => server.close(() => resolve(true)));
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

// Ensure runtime directories exist, create the schema, and seed/promote the
// bootstrap admin from env so there is always a way to sign in.
async function initialize() {
  fs.mkdirSync(ENV.dataDir, { recursive: true });
  fs.mkdirSync(ENV.uploadDir, { recursive: true });
  ensureSchema();

  if (ENV.adminEmail && ENV.adminPassword) {
    const existing = await getUserByEmail(ENV.adminEmail);
    const passwordHash = await hashPassword(ENV.adminPassword);
    if (existing) {
      await upsertUser({
        openId: existing.openId,
        role: "admin",
        passwordHash,
      });
      console.log(`[Init] Promoted ${ENV.adminEmail} to admin and reset its password`);
    } else {
      await createUser({
        openId: `local:${nanoid(16)}`,
        email: ENV.adminEmail,
        name: ENV.adminName,
        passwordHash,
        role: "admin",
      });
      console.log(`[Init] Created admin account ${ENV.adminEmail}`);
    }
  } else {
    console.warn(
      "[Init] ADMIN_EMAIL / ADMIN_PASSWORD not set — no admin seeded. Set them to enable admin sign-in.",
    );
  }
}

// Populate req.cookies from the Cookie header (the evaluator flow reads it).
function cookieMiddleware(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.cookie;
  (req as Request & { cookies: Record<string, string> }).cookies = header
    ? parseCookieHeader(header)
    : {};
  next();
}

async function startServer() {
  await initialize();

  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use(cookieMiddleware);

  registerFileRoutes(app);

  app.use(
    "/api/trpc",
    createExpressMiddleware({ router: appRouter, createContext }),
  );

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
