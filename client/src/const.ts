export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
// returnPath: the frontend path to redirect to after login (e.g. "/apply")
// IMPORTANT: The redirectUri must always be the clean base callback URL with no
// query params — the OAuth provider validates it against the registered URI.
// We store returnPath in sessionStorage before leaving so App.tsx can read it
// after the callback redirects back to "/".
export const getLoginUrl = (returnPath = "/") => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  // Persist the desired post-login destination before navigating away
  if (returnPath && returnPath !== "/") {
    sessionStorage.setItem("postLoginReturnPath", returnPath);
  }

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
