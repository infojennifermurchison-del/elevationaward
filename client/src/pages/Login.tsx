import { useMemo, useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, Trophy } from "lucide-react";

type Mode = "login" | "register";

export default function Login() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const returnPath = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("return");
    const fromSession =
      typeof sessionStorage !== "undefined"
        ? sessionStorage.getItem("postLoginReturnPath")
        : null;
    return fromQuery || fromSession || "/";
  }, []);

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const finish = async () => {
    try {
      sessionStorage.removeItem("postLoginReturnPath");
    } catch {
      /* ignore */
    }
    await utils.auth.me.invalidate();
    navigate(returnPath || "/");
  };

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: finish,
    onError: (err) => setError(err.message || "Sign in failed."),
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: finish,
    onError: (err) => setError(err.message || "Could not create your account."),
  });

  const pending = loginMutation.isPending || registerMutation.isPending;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (mode === "login") {
      loginMutation.mutate({ email, password });
    } else {
      registerMutation.mutate({ name, email, password });
    }
  };

  const inputClass =
    "w-full rounded-lg bg-white/5 border border-white/15 px-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/60 focus:border-transparent";

  return (
    <div className="min-h-screen bg-[#0a1628] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Trophy className="h-7 w-7 text-[#c9a84c]" />
          <span className="text-white font-semibold text-xl tracking-wide">
            RISE<span className="text-[#c9a84c]">hig</span>HER
          </span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-xl">
          <h1 className="text-2xl font-semibold text-white text-center">
            {mode === "login" ? "Sign in" : "Create your account"}
          </h1>
          <p className="mt-2 text-center text-sm text-white/50">
            {mode === "login"
              ? "Access your Elevation Award application."
              : "Start your Elevation Award application."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-sm text-white/70 mb-1.5" htmlFor="name">
                  Full name
                </label>
                <input
                  id="name"
                  className={inputClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>
            )}
            <div>
              <label className="block text-sm text-white/70 mb-1.5" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1.5" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength={mode === "register" ? 8 : undefined}
              />
              {mode === "register" && (
                <p className="mt-1 text-xs text-white/40">At least 8 characters.</p>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a1628] font-semibold px-4 py-2.5 transition-colors disabled:opacity-60"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-white/50">
            {mode === "login" ? (
              <>
                New here?{" "}
                <button
                  type="button"
                  className="text-[#c9a84c] hover:underline font-medium"
                  onClick={() => {
                    setMode("register");
                    setError("");
                  }}
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-[#c9a84c] hover:underline font-medium"
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-white/30">
          RISEhigHER Elevation Award
        </p>
      </div>
    </div>
  );
}
