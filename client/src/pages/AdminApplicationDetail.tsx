import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { Loader2, Trophy, ArrowLeft, Download, Star, StarOff, CheckCircle2, XCircle, Users } from "lucide-react";
import { toast } from "sonner";

const FILE_TYPE_LABELS: Record<string, string> = {
  formation_doc: "Business Formation Document",
  bank_account: "Business Bank Account Evidence",
  profit_loss: "Profit & Loss Statement",
  business_plan: "Business Plan",
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
  llc: "LLC",
  corporation: "Corporation",
  sole_proprietorship: "Sole Proprietorship with DBA",
  nonprofit: "Nonprofit",
  other: "Other",
};

function SectionHeader({ part, title }: { part: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
      <span
        className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded"
        style={{ backgroundColor: "oklch(18% 0.05 250 / 0.08)", color: "var(--navy-800)" }}
      >
        {part}
      </span>
      <h3 className="font-display text-lg font-semibold" style={{ color: "var(--navy-900)" }}>
        {title}
      </h3>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">{label}</dt>
      <dd className="text-sm" style={{ color: "var(--navy-900)" }}>{value}</dd>
    </div>
  );
}

function CertRow({ label, value }: { label: string; value?: boolean | null }) {
  return (
    <div className="flex items-start gap-3">
      {value ? (
        <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--gold-500)" }} />
      ) : (
        <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
      )}
      <span className="text-sm" style={{ color: "var(--navy-800)" }}>{label}</span>
    </div>
  );
}

function NarrativeBlock({ label, value, maxWords }: { label: string; value?: string | null; maxWords: number }) {
  if (!value) return null;
  const count = value.trim() === "" ? 0 : value.trim().split(/\s+/).length;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold" style={{ color: "var(--navy-900)" }}>{label}</h4>
        <span className="text-xs text-muted-foreground">{count} / {maxWords} words</span>
      </div>
      <div
        className="p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap"
        style={{ backgroundColor: "oklch(18% 0.05 250 / 0.04)", color: "var(--navy-800)" }}
      >
        {value}
      </div>
    </div>
  );
}

export default function AdminApplicationDetail() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id ?? "0");

  const appQuery = trpc.admin.getApplication.useQuery({ id }, { enabled: !!user && user.role === "admin" && !!id });
  const scoresQuery = trpc.admin.getApplicationScores.useQuery({ applicationId: id }, { enabled: !!user && user.role === "admin" && !!id });
  const markWinner = trpc.admin.markWinner.useMutation({
    onSuccess: () => { toast.success("Winner marked!"); appQuery.refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const unmarkWinner = trpc.admin.unmarkWinner.useMutation({
    onSuccess: () => { toast.success("Winner status removed"); appQuery.refetch(); },
    onError: (e) => toast.error(e.message),
  });

  if (loading || appQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Access denied</p>
      </div>
    );
  }

  if (!appQuery.data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Application not found</p>
      </div>
    );
  }

  const { application: app, budgetItems, files } = appQuery.data;
  const isWinner = app.status === "winner";
  const totalBudget = budgetItems.reduce((s, b) => s + b.amount, 0) / 100;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--cream)" }}>
      {/* Header */}
      <div
        className="border-b sticky top-0 z-40"
        style={{ backgroundColor: "var(--navy-950)", borderColor: "oklch(100% 0 0 / 0.08)" }}
      >
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin")}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Dashboard</span>
            </button>
            <span className="text-white/20">/</span>
            <span className="text-white text-sm font-medium truncate max-w-xs">
              {app.legalBusinessName || "Application #" + app.id}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isWinner ? (
              <Button
                size="sm"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 gap-2"
                onClick={() => unmarkWinner.mutate({ id: app.id })}
                disabled={unmarkWinner.isPending}
              >
                <StarOff className="w-4 h-4" />
                Remove Winner
              </Button>
            ) : (
              <Button
                size="sm"
                className="gap-2 font-semibold"
                style={{ backgroundColor: "var(--gold-500)", color: "var(--navy-950)" }}
                onClick={() => markWinner.mutate({ id: app.id })}
                disabled={markWinner.isPending}
              >
                <Star className="w-4 h-4" />
                Mark as Winner
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container py-10 max-w-4xl mx-auto">
        {/* Title */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-display text-3xl font-semibold" style={{ color: "var(--navy-900)" }}>
                {app.legalBusinessName || "Unnamed Business"}
              </h1>
              {isWinner && (
                <div
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold"
                  style={{ backgroundColor: "var(--gold-500)", color: "var(--navy-950)" }}
                >
                  <Star className="w-3.5 h-3.5" />
                  Winner
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {app.repName && <span>{app.repName}</span>}
              {app.email && <span>&bull; {app.email}</span>}
              {app.submittedAt && (
                <span>&bull; Submitted {new Date(app.submittedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
              )}
            </div>
          </div>
          <Badge
            variant="outline"
            className={`text-xs flex-shrink-0 ${app.status === "submitted" ? "border-blue-300 text-blue-700 bg-blue-50" : app.status === "winner" ? "border-amber-300 text-amber-700 bg-amber-50" : ""}`}
          >
            {app.status}
          </Badge>
        </div>

        <div className="space-y-6">
          {/* Part I */}
          <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
            <SectionHeader part="Part I" title="Business Information" />
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Legal Business Name" value={app.legalBusinessName} />
              <Field label="DBA" value={app.dba} />
              <Field label="Entity Type" value={app.entityType ? ENTITY_TYPE_LABELS[app.entityType] ?? app.entityType : undefined} />
              {app.entityType === "other" && <Field label="Entity Type (Other)" value={app.entityTypeOther} />}
              <Field label="State of Registration" value={app.stateOfRegistration} />
              <Field label="Date of Formation" value={app.dateOfFormation} />
              <Field label="Business Address" value={app.businessAddress} />
              <Field label="Authorized Representative" value={app.repName} />
              <Field label="Title" value={app.repTitle} />
              <Field label="Email" value={app.email} />
              <Field label="Phone" value={app.phone} />
              <div className="sm:col-span-2">
                <Field label="Business Description" value={app.businessDescription} />
              </div>
            </dl>
          </div>

          {/* Part II */}
          <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
            <SectionHeader part="Part II" title="Eligibility Certifications" />
            <div className="space-y-3">
              <CertRow label="Member of the RISEhigHER Network community" value={app.certMember} />
              <CertRow label="Active business registration in good standing" value={app.certRegistered} />
              <CertRow label="Business depository account in the legal name of the business" value={app.certBankAccount} />
              <CertRow label="Net profit not exceeding $5,000 for the most recent completed calendar quarter" value={app.certNetProfit} />
              <CertRow label="No W-2 personnel" value={app.certNoW2} />
              <CertRow label="Current written business plan" value={app.certBusinessPlan} />
            </div>
          </div>

          {/* Part III */}
          <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
            <SectionHeader part="Part III" title="Organizational Narratives" />
            <div className="space-y-6">
              <NarrativeBlock label="Customer Impact Narrative" value={app.customerImpactNarrative} maxWords={200} />
              <NarrativeBlock label="Operating History" value={app.operatingHistory} maxWords={150} />
              <NarrativeBlock label="Founder Narrative & Timeliness" value={app.founderNarrative} maxWords={150} />
              {app.operationMode && (
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Operation Mode</span>
                  <p className="text-sm mt-0.5" style={{ color: "var(--navy-900)" }}>
                    {app.operationMode === "full_time" ? "Full Time" : "Part Time"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Part IV */}
          <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
            <SectionHeader part="Part IV" title="Use of Funds & Projected Outcomes" />
            <div className="space-y-6">
              {budgetItems.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--navy-900)" }}>Itemized Budget</h4>
                  <div className="rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)" }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ backgroundColor: "oklch(18% 0.05 250 / 0.05)" }}>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description</th>
                          <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                        {budgetItems.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3" style={{ color: "var(--navy-800)" }}>{item.description}</td>
                            <td className="px-4 py-3 text-right font-medium" style={{ color: "var(--navy-900)" }}>
                              ${(item.amount / 100).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                        <tr style={{ backgroundColor: "oklch(18% 0.05 250 / 0.05)" }}>
                          <td className="px-4 py-3 font-semibold text-sm" style={{ color: "var(--navy-900)" }}>Total</td>
                          <td
                            className="px-4 py-3 text-right font-bold"
                            style={{ color: totalBudget === 1000 ? "oklch(55% 0.18 145)" : "var(--destructive)" }}
                          >
                            ${totalBudget.toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <NarrativeBlock label="90-Day Impact" value={app.ninetyDayImpact} maxWords={150} />
            </div>
          </div>

          {/* Part V */}
          <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
            <SectionHeader part="Part V" title="Supporting Documentation" />
            {files.length === 0 ? (
              <p className="text-sm text-muted-foreground">No documents uploaded</p>
            ) : (
              <div className="space-y-3">
                {(["formation_doc", "bank_account", "profit_loss", "business_plan"] as const).map((type) => {
                  const file = files.find((f) => f.fileType === type);
                  return (
                    <div
                      key={type}
                      className="flex items-center justify-between p-4 rounded-xl border"
                      style={{
                        borderColor: file ? "var(--gold-500)" : "var(--border)",
                        backgroundColor: file ? "oklch(72% 0.13 75 / 0.04)" : "oklch(18% 0.05 250 / 0.03)",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {file ? (
                          <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "var(--gold-500)" }} />
                        ) : (
                          <XCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                        )}
                        <div>
                          <p className="text-sm font-medium" style={{ color: "var(--navy-900)" }}>
                            {FILE_TYPE_LABELS[type]}
                          </p>
                          {file && (
                            <p className="text-xs text-muted-foreground">{file.originalName}</p>
                          )}
                        </div>
                      </div>
                      {file && (
                        <a
                          href={file.storageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors hover:bg-muted/50"
                          style={{ borderColor: "var(--border)", color: "var(--navy-800)" }}
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Part VI */}
          <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
            <SectionHeader part="Part VI" title="Certifications & Signature" />
            <div className="space-y-3 mb-5">
              <CertRow label="All statements and documentation are true, accurate, and complete" value={app.certAccuracy} />
              <CertRow label="Has read and agrees to the Official Rules" value={app.certAgreement} />
              <CertRow label="Consents to use of name and likeness in promotional materials" value={app.certConsent} />
              <CertRow label="Will furnish IRS Form W-9 and submit 90 Day Impact Kit if selected" value={app.certW9} />
            </div>
            {app.signatureName && (
              <div className="flex items-center gap-8 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Signature</p>
                  <p
                    className="text-xl"
                    style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", color: "var(--navy-900)" }}
                  >
                    {app.signatureName}
                  </p>
                </div>
                {app.signatureDate && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Date</p>
                    <p className="text-sm" style={{ color: "var(--navy-900)" }}>{app.signatureDate}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Evaluator Scores */}
          <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-3 mb-4 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
              <Users className="w-4 h-4" style={{ color: "var(--gold-500)" }} />
              <h3 className="font-display text-lg font-semibold" style={{ color: "var(--navy-900)" }}>Evaluator Scores</h3>
              {scoresQuery.data && scoresQuery.data.length > 0 && (
                <span className="ml-auto text-sm font-semibold" style={{ color: "var(--navy-900)" }}>
                  Avg:{" "}
                  <span style={{ color: "var(--gold-500)" }}>
                    {(
                      scoresQuery.data.reduce((sum, s) => sum + s.score.scoreCustomerImpact + s.score.scoreOperatingHistory + s.score.scoreFounderNarrative + s.score.scoreFundUse + s.score.scoreNinetyDayImpact, 0) /
                      scoresQuery.data.length
                    ).toFixed(1)}
                  </span>
                  {" "}/100
                </span>
              )}
            </div>
            {scoresQuery.isLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : !scoresQuery.data?.length ? (
              <p className="text-sm text-muted-foreground">No evaluator scores submitted yet.</p>
            ) : (
              <div className="space-y-4">
                {scoresQuery.data.map(({ score, evaluator }) => {
                  const total = score.scoreCustomerImpact + score.scoreOperatingHistory + score.scoreFounderNarrative + score.scoreFundUse + score.scoreNinetyDayImpact;
                  const pct = (total / 100) * 100;
                  return (
                    <div key={score.id} className="rounded-xl border p-4" style={{ borderColor: "var(--border)" }}>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="font-medium text-sm" style={{ color: "var(--navy-900)" }}>{evaluator.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">{evaluator.email}</span>
                        </div>
                        <span className={`text-xl font-bold tabular-nums ${pct >= 80 ? "text-emerald-600" : pct >= 60 ? "" : "text-muted-foreground"}`}
                          style={pct >= 60 && pct < 80 ? { color: "var(--gold-500)" } : undefined}>
                          {total}<span className="text-sm font-normal text-muted-foreground">/100</span>
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs mb-3">
                        {[
                          { label: "Customer Impact", val: score.scoreCustomerImpact, max: 25 },
                          { label: "Operating History", val: score.scoreOperatingHistory, max: 20 },
                          { label: "Founder Narrative", val: score.scoreFounderNarrative, max: 20 },
                          { label: "Use of Funds", val: score.scoreFundUse, max: 20 },
                          { label: "90-Day Impact", val: score.scoreNinetyDayImpact, max: 15 },
                        ].map(({ label, val, max }) => (
                          <div key={label} className="rounded-lg p-2" style={{ backgroundColor: "oklch(18% 0.05 250 / 0.04)" }}>
                            <div className="text-muted-foreground mb-0.5">{label}</div>
                            <div className="font-semibold" style={{ color: "var(--navy-900)" }}>{val}<span className="font-normal text-muted-foreground">/{max}</span></div>
                          </div>
                        ))}
                      </div>
                      {score.notes && (
                        <div className="text-xs p-3 rounded-lg" style={{ backgroundColor: "oklch(18% 0.05 250 / 0.04)", color: "var(--navy-800)" }}>
                          <span className="font-semibold text-muted-foreground uppercase tracking-wide">Notes: </span>
                          {score.notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
