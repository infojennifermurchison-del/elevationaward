import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  // Basic IPv4 check and IPv6 presence detection.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const hostname = req.hostname || "";
  const isLocal =
    !hostname ||
    LOCAL_HOSTS.has(hostname) ||
    isIpAddress(hostname) ||
    hostname.endsWith(".manus.computer") ||
    hostname.endsWith(".manus.space");

  // For custom domains (e.g. risehigheraward.com / www.risehigheraward.com),
  // set domain to .risehigheraward.com so the cookie works on both apex and www.
  // For local dev and manus preview domains, leave domain unset (host-only).
  let domain: string | undefined;
  if (!isLocal && !isIpAddress(hostname)) {
    // Strip leading www. to get the root domain, then prefix with dot
    const rootDomain = hostname.replace(/^www\./, "");
    domain = `.${rootDomain}`;
  }

  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req),
    ...(domain ? { domain } : {}),
  };
}
