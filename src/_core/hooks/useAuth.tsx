import { useCallback, useSyncExternalStore } from "react";

// Standalone auth hook (no provider required — it reads a shared module-level
// store synced to localStorage). This mirrors an OAuth session model: a real
// deployment would replace `login`/`logout` with redirects to the identity
// provider and a session cookie, but the surface (`user`, `loading`) stays the
// same so components don't change.

export type Role = "applicant" | "admin" | "evaluator";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarColor: string;
}

const KEY = "elevationaward-user";
const READY_KEY = "elevationaward-auth-ready";

const listeners = new Set<() => void>();

// A brief "loading" phase simulates resolving the session on first paint.
let ready = false;

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Cache the parsed user keyed by the raw string so getSnapshot returns a
// stable reference (required by useSyncExternalStore to avoid render loops).
let cachedRaw: string | null = null;
let cachedUser: AuthUser | null = null;

function getUser(): AuthUser | null {
  const raw = localStorage.getItem(KEY);
  if (raw === cachedRaw) return cachedUser;
  cachedRaw = raw;
  if (!raw) {
    cachedUser = null;
    return null;
  }
  try {
    cachedUser = JSON.parse(raw) as AuthUser;
  } catch {
    cachedUser = null;
  }
  return cachedUser;
}

function getReady(): boolean {
  return ready;
}

// Resolve the session shortly after load so the loading state is observable.
if (typeof window !== "undefined") {
  const alreadyResolved = sessionStorage.getItem(READY_KEY) === "1";
  if (alreadyResolved) {
    ready = true;
  } else {
    window.setTimeout(() => {
      ready = true;
      sessionStorage.setItem(READY_KEY, "1");
      emit();
    }, 350);
  }
  // Keep tabs in sync.
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) emit();
  });
}

const COLORS = ["#4f46e5", "#0891b2", "#059669", "#d97706", "#db2777"];

function colorFor(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + hash * 31;
  return COLORS[Math.abs(hash) % COLORS.length];
}

export interface LoginInput {
  role?: Role;
  name?: string;
  email?: string;
  /** When true, reload to "/" to exercise the post-login redirect flow. */
  viaRedirect?: boolean;
}

export function login(input: LoginInput = {}) {
  const email = input.email || `${input.role ?? "applicant"}@elevationaward.demo`;
  const name =
    input.name ||
    email
      .split("@")[0]
      .replace(/[._]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  const user: AuthUser = {
    id: `usr_${Math.random().toString(36).slice(2, 10)}`,
    name,
    email,
    role: input.role ?? "applicant",
    avatarColor: colorFor(email),
  };
  localStorage.setItem(KEY, JSON.stringify(user));
  if (input.viaRedirect) {
    // Simulate the identity provider returning to the app root; the
    // PostLoginRedirect component then forwards to the stored return path.
    window.location.assign("/");
  } else {
    emit();
  }
}

export function logout() {
  localStorage.removeItem(KEY);
  emit();
}

export function useAuth() {
  const user = useSyncExternalStore(subscribe, getUser, () => null);
  const loading = !useSyncExternalStore(subscribe, getReady, () => true);

  const doLogin = useCallback((input?: LoginInput) => login(input), []);
  const doLogout = useCallback(() => logout(), []);

  return { user, loading, login: doLogin, logout: doLogout };
}
