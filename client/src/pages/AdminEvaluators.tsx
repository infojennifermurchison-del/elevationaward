import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Trophy, Users, Copy, Trash2, Plus, Loader2, CheckCircle,
  Medal, Star, ArrowLeft, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

function ScoreBar({ value, max, color = "#c9a84c" }: { value: number; max: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${(value / max) * 100}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs tabular-nums text-white/50 w-10 text-right">{value}/{max}</span>
    </div>
  );
}

export default function AdminEvaluators() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const { data: invites, isLoading: invitesLoading } = trpc.admin.listInvites.useQuery(
    undefined, { enabled: isAuthenticated && user?.role === "admin" }
  );
  const { data: leaderboard, isLoading: lbLoading } = trpc.admin.leaderboard.useQuery(
    undefined, { enabled: isAuthenticated && user?.role === "admin" }
  );

  const createInviteMutation = trpc.admin.createInvite.useMutation({
    onSuccess: (data) => {
      toast.success(`Invite created for ${data.invite.name}`);
      setNewName("");
      setNewEmail("");
      utils.admin.listInvites.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const revokeInviteMutation = trpc.admin.revokeInvite.useMutation({
    onSuccess: () => {
      toast.success("Invite revoked");
      utils.admin.listInvites.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const getInviteLink = (token: string) =>
    `${window.location.origin}/evaluator/accept?token=${token}`;

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(getInviteLink(token));
    setCopiedToken(token);
    toast.success("Invite link copied to clipboard!");
    setTimeout(() => setCopiedToken(null), 2000);
  };

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <p className="text-white/40">Access denied.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1628]">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/admin")} className="text-white/40 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-[#c9a84c]" />
              <span className="text-white font-semibold">Evaluator Management</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-10">

        {/* ─── Leaderboard ─────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <Medal className="h-5 w-5 text-[#c9a84c]" />
            <h2 className="text-white font-semibold text-lg">Application Leaderboard</h2>
            <span className="text-white/30 text-sm ml-1">(ranked by average evaluator score)</span>
          </div>

          {lbLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 text-[#c9a84c] animate-spin" />
            </div>
          ) : !leaderboard?.length ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-white/30">
              No submitted applications yet.
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map(({ application, user: appUser, averageScore, scoreCount }, idx) => (
                <div
                  key={application.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-5"
                >
                  <div className="flex items-start gap-4">
                    {/* Rank */}
                    <div className={`text-2xl font-bold tabular-nums w-8 text-center shrink-0 ${
                      idx === 0 ? "text-[#c9a84c]" : idx === 1 ? "text-white/60" : idx === 2 ? "text-amber-700" : "text-white/20"
                    }`}>
                      {idx + 1}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium">
                          {application.legalBusinessName || "Unnamed Business"}
                        </span>
                        {application.status === "winner" && (
                          <Badge className="bg-[#c9a84c]/20 text-[#c9a84c] border-[#c9a84c]/30 text-xs">
                            Winner
                          </Badge>
                        )}
                      </div>
                      <p className="text-white/40 text-xs">
                        {application.entityType?.replace(/_/g, " ")} · {application.stateOfRegistration}
                        {scoreCount > 0 && ` · ${scoreCount} score${scoreCount !== 1 ? "s" : ""}`}
                      </p>
                    </div>

                    {/* Score */}
                    <div className="text-right shrink-0">
                      {averageScore !== null ? (
                        <>
                          <div className={`text-2xl font-bold tabular-nums ${
                            averageScore >= 80 ? "text-emerald-400" :
                            averageScore >= 60 ? "text-[#c9a84c]" : "text-white/60"
                          }`}>
                            {averageScore.toFixed(1)}
                          </div>
                          <div className="text-white/30 text-xs">avg / 100</div>
                        </>
                      ) : (
                        <span className="text-white/20 text-sm">No scores yet</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ─── Invite Management ───────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <Users className="h-5 w-5 text-[#c9a84c]" />
            <h2 className="text-white font-semibold text-lg">Evaluator Invites</h2>
          </div>

          {/* Create invite form */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-5">
            <h3 className="text-white/60 text-xs uppercase tracking-wider mb-4">Invite a New Evaluator</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <Input
                placeholder="Full name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
              <Input
                placeholder="Email address"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
            <Button
              onClick={() => createInviteMutation.mutate({ name: newName.trim(), email: newEmail.trim() })}
              disabled={!newName.trim() || !newEmail.trim() || createInviteMutation.isPending}
              className="bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a1628] font-semibold"
            >
              {createInviteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Generate Invite Link
            </Button>
          </div>

          {/* Invite list */}
          {invitesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 text-[#c9a84c] animate-spin" />
            </div>
          ) : !invites?.length ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center text-white/30">
              No evaluators invited yet. Generate an invite link above.
            </div>
          ) : (
            <div className="space-y-3">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className={`bg-white/5 border rounded-xl p-4 ${
                    invite.isRevoked ? "border-red-500/20 opacity-50" : "border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-white font-medium text-sm">{invite.name}</span>
                        {invite.isRevoked ? (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Revoked</Badge>
                        ) : invite.acceptedAt ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />Accepted
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">Pending</Badge>
                        )}
                      </div>
                      <div className="text-white/40 text-xs">{invite.email}</div>
                    </div>

                    {!invite.isRevoked && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyLink(invite.token)}
                          className="text-white/50 hover:text-white hover:bg-white/10 text-xs gap-1.5"
                        >
                          {copiedToken === invite.token ? (
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                          Copy Link
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`Revoke invite for ${invite.name}?`)) {
                              revokeInviteMutation.mutate({ id: invite.id });
                            }
                          }}
                          className="text-red-400/60 hover:text-red-400 hover:bg-red-500/10 text-xs gap-1.5"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Revoke
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ─── How it works ────────────────────────────────────────────────── */}
        <section className="bg-white/3 border border-white/8 rounded-xl p-6">
          <h3 className="text-white/60 text-xs uppercase tracking-wider mb-3">How Evaluator Access Works</h3>
          <ol className="space-y-2 text-white/50 text-sm list-decimal list-inside">
            <li>Enter the evaluator's name and email above and click <strong className="text-white/70">Generate Invite Link</strong>.</li>
            <li>Copy the generated link and send it to your evaluator by email or message.</li>
            <li>When they click the link, they are instantly signed in to the scoring portal — no account needed.</li>
            <li>They score each application on the 100-point rubric. Their scores are saved automatically.</li>
            <li>The leaderboard above updates in real time as scores come in.</li>
            <li>You can revoke any invite at any time to remove their access.</li>
          </ol>
        </section>

      </main>
    </div>
  );
}
