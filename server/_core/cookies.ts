import type { CookieOptions, Request } from "express";

// The app serves its UI and API from the same origin, so a "lax" session
// cookie is correct and works on plain-HTTP localhost during development. In
// production behind HTTPS the cookie is marked Secure.
function isSecureRequest(req: Request): boolean {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const list = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");
  return list.some((p) => p.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(
  req: Request,
): Pick<CookieOptions, "httpOnly" | "path" | "sameSite" | "secure"> {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: isSecureRequest(req),
  };
}
