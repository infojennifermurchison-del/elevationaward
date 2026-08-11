import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Trophy, LogOut, CheckCircle, Clock, Star, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

function ScoreBadge({ score }: { score: number }) {
  const pct = Math.round((score / 100) * 100);
  const color =
    pct >= 80 ? "text-emerald-400" : pct >= 60 ? "text-[#c9a84c]" : "text-white/50";
  return (
    <span className={`font-bold text-lg tabular-nums ${color}`}>
      {score.toFixed(1)}<span className="text-sm font-normal text-white/40">/100</span>
    </span>
  );
}

export default function EvaluatorPortal() {
  const [, navigate] = useLocation();

  const { data: me, isLoading: meLoading } = trpc.evaluator.me.useQuery();
  const { data: applications, isLoading: appsLoading } = trpc.evaluator.listApplications.useQuery(
    undefined,
    { enabled: !!me }
  );
  const logoutMutation = trpc.evaluator.logout.useMutation({
    onSuccess: () => {
      toast.success("Signed out");
      navigate("/");
    },
  });

  useEffect(() => {
    if (!meLoading && !me) {
      navigate("/");
    }
  }, [me, meLoading]);

  if (meLoading || appsLoading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#c9a84c] animate-spin" />
      </div>
    );
  }

  if (!me) return null;

  const scored = applications?.filter((a) => a.myScore !== null).length ?? 0;
  const total = applications?.length ?? 0;

  return (
    <div className="min-h-screen bg-[#0a1628]">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-[#c9a84c]" />
            <div>
              <div className="text-white font-semibold text-sm">
                RISE<span className="text-[#c9a84c]">hig</span>HER Elevation Award
              </div>
              <div className="text-white/40 text-xs">Evaluator Portal</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white/60 text-sm hidden sm:block">
              Signed in as <span className="text-white">{me.name}</span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Progress summary */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white mb-1">Applications to Score</h1>
          <p className="text-white/50 text-sm">
            You have scored <span className="text-[#c9a84c] font-medium">{scored}</span> of{" "}
            <span className="text-white font-medium">{total}</span> applications.
          </p>
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div className="mb-8">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#c9a84c] rounded-full transition-all duration-500"
                style={{ width: `${(scored / total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Application list */}
        {total === 0 ? (
          <div className="text-center py-20 text-white/40">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No submitted applications yet.</p>
            <p className="text-sm mt-1">Check back after the July 31 deadline.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {applications?.map(({ application, user, myScore, averageScore, scoreCount }) => {
              const myTotal = myScore
                ? myScore.scoreCustomerImpact +
                  myScore.scoreOperatingHistory +
                  myScore.scoreFounderNarrative +
                  myScore.scoreFundUse +
                  myScore.scoreNinetyDayImpact
                : null;

              return (
                <button
                  key={application.id}
                  onClick={() => navigate(`/evaluator/score/${application.id}`)}
                  className="w-full text-left bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#c9a84c]/40 rounded-xl p-5 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-medium truncate">
                          {application.legalBusinessName || "Unnamed Business"}
                        </h3>
                        {application.status === "winner" && (
                          <Badge className="bg-[#c9a84c]/20 text-[#c9a84c] border-[#c9a84c]/30 text-xs">
                            Winner
                          </Badge>
                        )}
                      </div>
                      <p className="text-white/40 text-sm truncate">
                        {application.entityType?.replace("_", " ")} ·{" "}
                        {application.stateOfRegistration}
                      </p>
                      {scoreCount > 0 && (
                        <p className="text-white/30 text-xs mt-1">
                          {scoreCount} evaluator score{scoreCount !== 1 ? "s" : ""} ·{" "}
                          avg {averageScore?.toFixed(1)}/100
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {myTotal !== null ? (
                        <div className="text-right">
                          <div className="text-xs text-white/40 mb-0.5">Your score</div>
                          <ScoreBadge score={myTotal} />
                        </div>
                      ) : (
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                          Not scored
                        </Badge>
                      )}
                      <ChevronRight className="h-4 w-4 text-white/30 group-hover:text-[#c9a84c] transition-colors" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
