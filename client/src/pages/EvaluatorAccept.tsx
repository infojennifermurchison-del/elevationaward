import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, CheckCircle, XCircle, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EvaluatorAccept() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [evaluatorName, setEvaluatorName] = useState("");

  const acceptMutation = trpc.evaluator.acceptInvite.useMutation({
    onSuccess: (data) => {
      setEvaluatorName(data.evaluatorName ?? "");
      setStatus("success");
    },
    onError: (err) => {
      setErrorMsg(err.message || "This invite link is invalid or has been revoked.");
      setStatus("error");
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (!t) {
      setErrorMsg("No invite token found in this link.");
      setStatus("error");
      return;
    }
    setToken(t);
    acceptMutation.mutate({ token: t });
  }, []);

  return (
    <div className="min-h-screen bg-[#0a1628] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <Trophy className="h-7 w-7 text-[#c9a84c]" />
          <span className="text-white font-semibold text-xl tracking-wide">
            RISE<span className="text-[#c9a84c]">hig</span>HER
          </span>
        </div>

        {status === "loading" && (
          <div className="space-y-4">
            <Loader2 className="h-12 w-12 text-[#c9a84c] animate-spin mx-auto" />
            <p className="text-white/70 text-lg">Verifying your invite link…</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-6">
            <CheckCircle className="h-16 w-16 text-emerald-400 mx-auto" />
            <div>
              <h1 className="text-2xl font-semibold text-white mb-2">
                Welcome, {evaluatorName}!
              </h1>
              <p className="text-white/60 leading-relaxed">
                You now have access to the RISEhigHER Elevation Award scoring portal.
                You can review all submitted applications and score them on the official
                100-point rubric.
              </p>
            </div>
            <Button
              onClick={() => navigate("/evaluator")}
              className="bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a1628] font-semibold px-8 py-3 text-base"
            >
              Go to Scoring Portal →
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-6">
            <XCircle className="h-16 w-16 text-red-400 mx-auto" />
            <div>
              <h1 className="text-2xl font-semibold text-white mb-2">
                Invalid Invite Link
              </h1>
              <p className="text-white/60 leading-relaxed">{errorMsg}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Return to Home
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
