import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import { parse as parseCookieHeader } from "cookie";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { User } from "../../drizzle/schema";
import { getUserById } from "../db";
import { ENV } from "./env";

// Self-contained session handling. A signed JWT (HS256) stored in an httpOnly
// cookie carries the user's id. No external identity provider is involved.

function secretKey(): Uint8Array {
  return new TextEncoder().encode(ENV.cookieSecret);
}

export async function signSession(
  userId: number,
  options: { expiresInMs?: number } = {},
): Promise<string> {
  const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
  const exp = Math.floor((Date.now() + expiresInMs) / 1000);
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(secretKey());
}

export async function verifySession(
  cookieValue: string | undefined | null,
): Promise<{ userId: number } | null> {
  if (!cookieValue) return null;
  try {
    const { payload } = await jwtVerify(cookieValue, secretKey(), {
      algorithms: ["HS256"],
    });
    const userId = payload.userId;
    if (typeof userId !== "number") return null;
    return { userId };
  } catch {
    return null;
  }
}

function readSessionCookie(req: Request): string | undefined {
  const raw = req.headers.cookie;
  if (!raw) return undefined;
  const parsed = parseCookieHeader(raw);
  return parsed[COOKIE_NAME];
}

// Resolve the authenticated user for a request, or null for anonymous.
export async function authenticateRequest(req: Request): Promise<User | null> {
  const session = await verifySession(readSessionCookie(req));
  if (!session) return null;
  const user = await getUserById(session.userId);
  return user ?? null;
}
