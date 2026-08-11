export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// The app uses its own email + password sign-in page at /login (no external
// identity provider). Callers that previously redirected to an OAuth portal now
// go to /login, preserving the intended destination via ?return= and the
// existing postLoginReturnPath session key used by App.tsx.
export const getLoginUrl = (returnPath = "/") => {
  if (returnPath && returnPath !== "/") {
    try {
      sessionStorage.setItem("postLoginReturnPath", returnPath);
    } catch {
      /* ignore */
    }
    return `/login?return=${encodeURIComponent(returnPath)}`;
  }
  return "/login";
};
