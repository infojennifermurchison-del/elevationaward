import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  Trophy, ArrowLeft, Loader2, Save, CheckCircle, ChevronDown, ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

interface RubricCategory {
  key: "scoreCustomerImpact" | "scoreOperatingHistory" | "scoreFounderNarrative" | "scoreFundUse" | "scoreNinetyDayImpact";
  label: string;
  max: number;
  description: string;
}

const RUBRIC: RubricCategory[] = [
  {
    key: "scoreCustomerImpact",
    label: "Customer Impact & Market Need",
    max: 25,
    description: "How clearly does the applicant articulate the problem they solve, who their customers are, and the measurable impact on those customers?",
  },
  {
    key: "scoreOperatingHistory",
    label: "Operating History & Traction",
    max: 20,
    description: "Does the business demonstrate real operating history, revenue, customers, or other evidence of traction?",
  },
  {
    key: "scoreFounderNarrative",
    label: "Founder Narrative & Commitment",
    max: 20,
    description: "How compelling is the founder's story? Does it reflect genuine commitment, resilience, and alignment with the business?",
  },
  {
    key: "scoreFundUse",
    label: "Use of Funds",
    max: 20,
    description: "Is the $1,000 budget plan specific, realistic, and directly tied to business growth? Are the line items well-reasoned?",
  },
  {
    key: "scoreNinetyDayImpact",
    label: "90-Day Impact Plan",
    max: 15,
    description: "Does the applicant have a clear, measurable plan for what they will achieve within 90 days of receiving the award?",
  },
];

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white/5 hover:bg-white/8 text-left transition-colors"
      >
        <span className="text-white font-medium text-sm uppercase tracking-wider">{title}</span>
        {open ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />}
      </button>
      {open && <div className="px-5 py-5 space-y-4">{children}</div>}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-white/40 text-xs uppercase tracking-wider mb-1">{label}</div>
      <div className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{value}</div>
    </div>
  );
}

export default function EvaluatorScore() {
  const params = useParams<{ id: string }>();
  const applicationId = parseInt(params.id ?? "0", 10);
  const [, navigate] = useLocation();

  const { data: me, isLoading: meLoading } = trpc.evaluator.me.useQuery();
  const { data, isLoading, refetch } = trpc.evaluator.getApplication.useQuery(
    { id: applicationId },
    { enabled: !!me && !!applicationId }
  );

  const [scores, setScores] = useState<Record<string, number>>({
    scoreCustomerImpact: 0,
    scoreOperatingHistory: 0,
    scoreFounderNarrative: 0,
    scoreFundUse: 0,
    scoreNinetyDayImpact: 0,
  });
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);

  // Populate from existing score
  useEffect(() => {
    if (data?.myScore) {
      setScores({
        scoreCustomerImpact: data.myScore.scoreCustomerImpact,
        scoreOperatingHistory: data.myScore.scoreOperatingHistory,
        scoreFounderNarrative: data.myScore.scoreFounderNarrative,
        scoreFundUse: data.myScore.scoreFundUse,
        scoreNinetyDayImpact: data.myScore.scoreNinetyDayImpact,
      });
      setNotes(data.myScore.notes ?? "");
    }
  }, [data?.myScore]);

  useEffect(() => {
    if (!meLoading && !me) navigate("/");
  }, [me, meLoading]);

  const submitMutation = trpc.evaluator.submitScore.useMutation({
    onSuccess: () => {
      toast.success("Score saved successfully!");
      setSaved(true);
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to save score");
    },
  });

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

  const handleSubmit = () => {
    submitMutation.mutate({
      applicationId,
      scoreCustomerImpact: scores.scoreCustomerImpact,
      scoreOperatingHistory: scores.scoreOperatingHistory,
      scoreFounderNarrative: scores.scoreFounderNarrative,
      scoreFundUse: scores.scoreFundUse,
      scoreNinetyDayImpact: scores.scoreNinetyDayImpact,
      notes,
    });
  };

  if (meLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#c9a84c] animate-spin" />
      </div>
    );
  }

  if (!me || !data) return null;

  const { application, budgetItems } = data;

  return (
    <div className="min-h-screen bg-[#0a1628]">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 sticky top-0 bg-[#0a1628]/95 backdrop-blur z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/evaluator")}
              className="text-white/40 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="text-white font-medium text-sm">
                {application.legalBusinessName || "Application"}
              </div>
              <div className="text-white/40 text-xs">Scoring — {me.name}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs text-white/40">Total Score</div>
              <div className={`text-xl font-bold tabular-nums ${
                totalScore >= 80 ? "text-emerald-400" : totalScore >= 60 ? "text-[#c9a84c]" : "text-white"
              }`}>
                {totalScore}<span className="text-sm font-normal text-white/40">/100</span>
              </div>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              className="bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a1628] font-semibold"
            >
              {submitMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : saved ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saved ? "Update Score" : "Save Score"}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Application content */}
        <div className="space-y-4">
          <h2 className="text-white/60 text-xs uppercase tracking-widest font-medium">Application</h2>

          <Section title="Part I — Business Information">
            <Field label="Legal Business Name" value={application.legalBusinessName} />
            <Field label="DBA" value={application.dba} />
            <Field label="Entity Type" value={application.entityType?.replace(/_/g, " ")} />
            <Field label="State of Registration" value={application.stateOfRegistration} />
            <Field label="Date of Formation" value={application.dateOfFormation} />
            <Field label="Business Address" value={application.businessAddress} />
            <Field label="Representative" value={application.repName} />
            <Field label="Title" value={application.repTitle} />
            <Field label="Business Description" value={application.businessDescription} />
            <Field label="Operation Mode" value={application.operationMode?.replace("_", "-")} />
          </Section>

          <Section title="Part III — Narratives">
            <Field label="Customer Impact" value={application.customerImpactNarrative} />
            <Field label="Operating History" value={application.operatingHistory} />
            <Field label="Founder Narrative" value={application.founderNarrative} />
          </Section>

          <Section title="Part IV — Use of Funds">
            {budgetItems.length > 0 && (
              <div>
                <div className="text-white/40 text-xs uppercase tracking-wider mb-2">Budget Items</div>
                <div className="space-y-1.5">
                  {budgetItems.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-white/70">{item.description}</span>
                      <span className="text-[#c9a84c] font-medium tabular-nums">
                        ${(item.amount / 100).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm border-t border-white/10 pt-1.5 mt-1.5">
                    <span className="text-white/50">Total</span>
                    <span className="text-white font-semibold tabular-nums">
                      ${(budgetItems.reduce((s, i) => s + i.amount, 0) / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <Field label="90-Day Impact Plan" value={application.ninetyDayImpact} />
          </Section>
        </div>

        {/* Right: Scoring rubric */}
        <div className="space-y-4">
          <h2 className="text-white/60 text-xs uppercase tracking-widest font-medium">Scoring Rubric</h2>

          {/* Total score display */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
            <div className="text-white/40 text-xs uppercase tracking-wider mb-1">Total Score</div>
            <div className={`text-5xl font-bold tabular-nums mb-1 ${
              totalScore >= 80 ? "text-emerald-400" : totalScore >= 60 ? "text-[#c9a84c]" : "text-white"
            }`}>
              {totalScore}
            </div>
            <div className="text-white/30 text-sm">out of 100 points</div>
          </div>

          {/* Rubric sliders */}
          <div className="space-y-4">
            {RUBRIC.map((cat) => (
              <div key={cat.key} className="bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 pr-4">
                    <div className="text-white font-medium text-sm">{cat.label}</div>
                    <div className="text-white/40 text-xs mt-0.5 leading-relaxed">{cat.description}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[#c9a84c] font-bold text-xl tabular-nums">
                      {scores[cat.key]}
                    </span>
                    <span className="text-white/30 text-sm">/{cat.max}</span>
                  </div>
                </div>
                <Slider
                  min={0}
                  max={cat.max}
                  step={1}
                  value={[scores[cat.key]]}
                  onValueChange={([val]) => {
                    setScores((prev) => ({ ...prev, [cat.key]: val }));
                    setSaved(false);
                  }}
                  className="mt-3"
                />
                <div className="flex justify-between text-white/20 text-xs mt-1">
                  <span>0</span>
                  <span>{cat.max}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <label className="text-white/40 text-xs uppercase tracking-wider block mb-2">
              Evaluator Notes (optional)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => { setNotes(e.target.value); setSaved(false); }}
              placeholder="Add any notes or comments about this application…"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/20 resize-none min-h-[100px]"
            />
          </div>

          {/* Save button (bottom) */}
          <Button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            className="w-full bg-[#c9a84c] hover:bg-[#b8963e] text-[#0a1628] font-semibold py-3 text-base"
          >
            {submitMutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</>
            ) : saved ? (
              <><CheckCircle className="h-4 w-4 mr-2" />Score Saved — Update</>
            ) : (
              <><Save className="h-4 w-4 mr-2" />Save Score</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
