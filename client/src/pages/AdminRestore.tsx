import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Loader2, Trophy, UploadCloud, CheckCircle2, AlertCircle } from "lucide-react";

type Phase = "idle" | "uploading" | "restarting" | "done" | "error";

export default function AdminRestore() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!loading && !user) window.location.href = getLoginUrl("/admin/restore");
  }, [user, loading]);

  // After a successful restore the server restarts; wait, then reload into admin.
  useEffect(() => {
    if (phase !== "restarting") return;
    let secs = 30;
    setCountdown(secs);
    const t = setInterval(() => {
      secs -= 1;
      setCountdown(secs);
      if (secs <= 0) {
        clearInterval(t);
        window.location.href = "/admin";
      }
    }, 1000);
    return () => clearInterval(t);
  }, [phase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return null;

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a1628] text-white px-6 text-center">
        <div>
          <Trophy className="w-10 h-10 mx-auto mb-4 text-[#c9a84c]" />
          <h1 className="text-2xl font-semibold mb-2">Access restricted</h1>
          <p className="text-white/60">This page is only for the site owner.</p>
        </div>
      </div>
    );
  }

  const upload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setMessage("Choose the data file first.");
      setPhase("error");
      return;
    }
    setPhase("uploading");
    setMessage("");
    try {
      const resp = await fetch("/api/admin/restore", {
        method: "PUT",
        body: file,
        credentials: "include",
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.error || `Upload failed (${resp.status})`);
      setPhase("restarting");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Upload failed.");
      setPhase("error");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1628] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Trophy className="h-7 w-7 text-[#c9a84c]" />
          <span className="text-white font-semibold text-xl tracking-wide">
            RISE<span className="text-[#c9a84c]">hig</span>HER
          </span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-xl text-center">
          {phase === "restarting" ? (
            <>
              <CheckCircle2 className="h-14 w-14 text-emerald-400 mx-auto mb-4" />
              <h1 className="text-2xl font-semibold text-white mb-2">Data restored</h1>
              <p className="text-white/60">
                The site is restarting to load your data. This page will open the
                admin dashboard automatically in {countdown}s.
              </p>
              <button
                onClick={() => (window.location.href = "/admin")}
                className="mt-6 rounded-lg bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a1628] font-semibold px-6 py-2.5"
              >
                Go to dashboard now
              </button>
            </>
          ) : (
            <>
              <UploadCloud className="h-12 w-12 text-[#c9a84c] mx-auto mb-3" />
              <h1 className="text-2xl font-semibold text-white mb-1">Restore data</h1>
              <p className="text-white/55 text-sm mb-6">
                Upload the data file to load applications and documents. This
                replaces the current data with the contents of the file.
              </p>

              <label className="block cursor-pointer rounded-xl border border-dashed border-white/20 bg-white/[0.02] px-4 py-8 hover:border-[#c9a84c]/50 transition-colors">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".gz,.tgz,application/gzip"
                  className="hidden"
                  onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
                />
                <span className="text-white/80 text-sm">
                  {fileName ? (
                    <>Selected: <strong className="text-white">{fileName}</strong></>
                  ) : (
                    "Click to choose the data file (.tar.gz)"
                  )}
                </span>
              </label>

              {phase === "error" && (
                <p className="mt-4 flex items-center justify-center gap-2 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4" /> {message}
                </p>
              )}

              <button
                onClick={upload}
                disabled={phase === "uploading"}
                className="mt-6 w-full flex items-center justify-center gap-2 rounded-lg bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a1628] font-semibold px-4 py-2.5 disabled:opacity-60"
              >
                {phase === "uploading" && <Loader2 className="h-4 w-4 animate-spin" />}
                {phase === "uploading" ? "Uploading…" : "Restore data"}
              </button>

              <button
                onClick={() => navigate("/admin")}
                className="mt-3 text-sm text-white/50 hover:text-white/80"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
