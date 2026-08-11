import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  Trophy,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Upload,
  X,
  Plus,
  Trash2,
  Loader2,
  Save,
  Clock,
  FileText,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface BudgetItem {
  description: string;
  amount: number;
  sortOrder: number;
}

interface FileUploadState {
  formation_doc: { name: string; url: string } | null;
  bank_account: { name: string; url: string } | null;
  profit_loss: { name: string; url: string } | null;
  business_plan: { name: string; url: string } | null;
}

// ─── Word Counter ─────────────────────────────────────────────────────────────
function wordCount(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

function WordCountedTextarea({
  value,
  onChange,
  maxWords,
  placeholder,
  rows = 5,
}: {
  value: string;
  onChange: (v: string) => void;
  maxWords: number;
  placeholder?: string;
  rows?: number;
}) {
  const count = wordCount(value);
  const over = count > maxWords;

  return (
    <div className="space-y-1">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`resize-none ${over ? "border-red-400 focus-visible:ring-red-400" : ""}`}
      />
      <div className={`text-xs text-right ${over ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
        {count} / {maxWords} words{over ? " — over limit" : ""}
      </div>
    </div>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────
const STEPS = [
  { label: "Business Info", short: "I" },
  { label: "Eligibility", short: "II" },
  { label: "Narratives", short: "III" },
  { label: "Use of Funds", short: "IV" },
  { label: "Documents", short: "V" },
  { label: "Certify & Sign", short: "VI" },
];

function StepIndicator({ current, completed }: { current: number; completed: Set<number> }) {
  return (
    <div className="flex items-center justify-between w-full max-w-2xl mx-auto mb-10">
      {STEPS.map((step, i) => {
        const isActive = i === current;
        const isDone = completed.has(i);
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200"
                style={{
                  backgroundColor: isDone
                    ? "var(--gold-500)"
                    : isActive
                    ? "var(--navy-900)"
                    : "var(--border)",
                  color: isDone ? "var(--navy-950)" : isActive ? "white" : "var(--muted-foreground)",
                }}
              >
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : step.short}
              </div>
              <span
                className="text-xs mt-1 hidden sm:block"
                style={{
                  color: isActive ? "var(--navy-900)" : "var(--muted-foreground)",
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="h-0.5 flex-1 mx-2 mb-4 sm:mb-5"
                style={{
                  backgroundColor: isDone ? "var(--gold-500)" : "var(--border)",
                  minWidth: "16px",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Apply Page ──────────────────────────────────────────────────────────
export default function Apply() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [applicationId, setApplicationId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [disqualified, setDisqualified] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Form state ──
  // Part I
  const [legalBusinessName, setLegalBusinessName] = useState("");
  const [dba, setDba] = useState("");
  const [entityType, setEntityType] = useState<string>("");
  const [entityTypeOther, setEntityTypeOther] = useState("");
  const [stateOfRegistration, setStateOfRegistration] = useState("");
  const [dateOfFormation, setDateOfFormation] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [repName, setRepName] = useState("");
  const [repTitle, setRepTitle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");

  // Part II
  const [certMember, setCertMember] = useState(false);
  const [certRegistered, setCertRegistered] = useState(false);
  const [certBankAccount, setCertBankAccount] = useState(false);
  const [certNetProfit, setCertNetProfit] = useState(false);
  const [certNoW2, setCertNoW2] = useState(false);
  const [certBusinessPlan, setCertBusinessPlan] = useState(false);

  // Part III
  const [customerImpactNarrative, setCustomerImpactNarrative] = useState("");
  const [operatingHistory, setOperatingHistory] = useState("");
  const [founderNarrative, setFounderNarrative] = useState("");
  const [operationMode, setOperationMode] = useState<"full_time" | "part_time" | "">("");

  // Part IV
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([
    { description: "", amount: 0, sortOrder: 0 },
  ]);
  const [ninetyDayImpact, setNinetyDayImpact] = useState("");

  // Part V
  const [uploadedFiles, setUploadedFiles] = useState<FileUploadState>({
    formation_doc: null,
    bank_account: null,
    profit_loss: null,
    business_plan: null,
  });
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);

  // Part VI
  const [certAccuracy, setCertAccuracy] = useState(false);
  const [certAgreement, setCertAgreement] = useState(false);
  const [certConsent, setCertConsent] = useState(false);
  const [certW9, setCertW9] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [signatureDate, setSignatureDate] = useState("");

  // ── tRPC ──
  // Single query that gets-or-creates the application — runs automatically when user is logged in
  const getOrCreate = trpc.application.getOrCreate.useQuery(undefined, { enabled: !!user, retry: 3 });
  const saveMutation = trpc.application.save.useMutation();
  const submitMutation = trpc.application.submit.useMutation();
  const uploadFileMutation = trpc.application.uploadFile.useMutation();
  const deadlineQuery = trpc.application.deadlineStatus.useQuery();

  // ── Redirect if not logged in ──
  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = getLoginUrl("/apply");
    }
  }, [user, authLoading]);

  // ── Load existing application ──
  useEffect(() => {
    if (getOrCreate.data) {
      const { application: app, budgetItems: items, files } = getOrCreate.data;
      setApplicationId(app.id);
      // Part I
      setLegalBusinessName(app.legalBusinessName ?? "");
      setDba(app.dba ?? "");
      setEntityType(app.entityType ?? "");
      setEntityTypeOther(app.entityTypeOther ?? "");
      setStateOfRegistration(app.stateOfRegistration ?? "");
      setDateOfFormation(app.dateOfFormation ?? "");
      setBusinessAddress(app.businessAddress ?? "");
      setRepName(app.repName ?? "");
      setRepTitle(app.repTitle ?? "");
      setEmail(app.email ?? "");
      setPhone(app.phone ?? "");
      setBusinessDescription(app.businessDescription ?? "");
      // Part II
      setCertMember(app.certMember ?? false);
      setCertRegistered(app.certRegistered ?? false);
      setCertBankAccount(app.certBankAccount ?? false);
      setCertNetProfit(app.certNetProfit ?? false);
      setCertNoW2(app.certNoW2 ?? false);
      setCertBusinessPlan(app.certBusinessPlan ?? false);
      // Part III
      setCustomerImpactNarrative(app.customerImpactNarrative ?? "");
      setOperatingHistory(app.operatingHistory ?? "");
      setFounderNarrative(app.founderNarrative ?? "");
      setOperationMode((app.operationMode as any) ?? "");
      // Part IV
      setNinetyDayImpact(app.ninetyDayImpact ?? "");
      if (items.length > 0) setBudgetItems(items.map((b) => ({ description: b.description, amount: b.amount / 100, sortOrder: b.sortOrder ?? 0 })));
      // Part V
      const fileMap: FileUploadState = { formation_doc: null, bank_account: null, profit_loss: null, business_plan: null };
      for (const f of files) {
        fileMap[f.fileType as keyof FileUploadState] = { name: f.originalName, url: f.storageUrl };
      }
      setUploadedFiles(fileMap);
      // Part VI
      setCertAccuracy(app.certAccuracy ?? false);
      setCertAgreement(app.certAgreement ?? false);
      setCertConsent(app.certConsent ?? false);
      setCertW9(app.certW9 ?? false);
      setSignatureName(app.signatureName ?? "");
      setSignatureDate(app.signatureDate ?? "");

      if (app.status === "submitted") {
        navigate("/apply/confirmation");
      }
    }
  }, [getOrCreate.data]);

  // ── Auto-save ──
  const buildSavePayload = useCallback(() => {
    if (!applicationId) return null;
    return {
      applicationId,
      legalBusinessName, dba, entityType: entityType as any, entityTypeOther,
      stateOfRegistration, dateOfFormation, businessAddress,
      repName, repTitle, email, phone, businessDescription,
      certMember, certRegistered, certBankAccount, certNetProfit, certNoW2, certBusinessPlan,
      customerImpactNarrative, operatingHistory, founderNarrative, operationMode: operationMode as any,
      ninetyDayImpact,
      budgetItems: budgetItems.map((b, i) => ({ description: b.description, amount: Math.round(b.amount * 100), sortOrder: i })),
      certAccuracy, certAgreement, certConsent, certW9, signatureName, signatureDate,
    };
  }, [applicationId, legalBusinessName, dba, entityType, entityTypeOther, stateOfRegistration, dateOfFormation, businessAddress, repName, repTitle, email, phone, businessDescription, certMember, certRegistered, certBankAccount, certNetProfit, certNoW2, certBusinessPlan, customerImpactNarrative, operatingHistory, founderNarrative, operationMode, ninetyDayImpact, budgetItems, certAccuracy, certAgreement, certConsent, certW9, signatureName, signatureDate]);

  const triggerAutoSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      const payload = buildSavePayload();
      if (!payload) return;
      setSaving(true);
      try {
        await saveMutation.mutateAsync(payload);
        setLastSaved(new Date());
      } catch (_) {}
      setSaving(false);
    }, 1500);
  }, [buildSavePayload, saveMutation]);

  // Trigger auto-save on any field change
  useEffect(() => {
    if (applicationId) triggerAutoSave();
  }, [legalBusinessName, dba, entityType, entityTypeOther, stateOfRegistration, dateOfFormation, businessAddress, repName, repTitle, email, phone, businessDescription, certMember, certRegistered, certBankAccount, certNetProfit, certNoW2, certBusinessPlan, customerImpactNarrative, operatingHistory, founderNarrative, operationMode, ninetyDayImpact, budgetItems, certAccuracy, certAgreement, certConsent, certW9, signatureName, signatureDate]);

  // ── File upload ──
  const handleFileUpload = async (fileType: keyof FileUploadState, file: File) => {
    if (!applicationId) return;
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are accepted");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10 MB");
      return;
    }
    setUploadingFile(fileType);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const result = await uploadFileMutation.mutateAsync({
        applicationId,
        fileType,
        fileName: file.name,
        fileBase64: base64,
      });
      setUploadedFiles((prev) => ({ ...prev, [fileType]: { name: file.name, url: result.url } }));
      toast.success("Document uploaded successfully");
    } catch (err: any) {
      toast.error(err?.message ?? "Upload failed");
    }
    setUploadingFile(null);
  };

  // ── Navigation ──
  const handleNext = () => {
    if (step === 1) {
      // Check disqualification
      const allCerts = certMember && certRegistered && certBankAccount && certNetProfit && certNoW2 && certBusinessPlan;
      if (!allCerts) {
        setDisqualified(true);
        return;
      }
    }
    setCompletedSteps((prev) => new Set(Array.from(prev).concat(step)));
    setStep((s) => Math.min(s + 1, 5));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setDisqualified(false);
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!applicationId) return;

    // Pre-flight: check all 4 documents are uploaded
    const missingDocs: string[] = [];
    if (!uploadedFiles.formation_doc) missingDocs.push("Business Formation Document");
    if (!uploadedFiles.bank_account) missingDocs.push("Business Bank Account Evidence");
    if (!uploadedFiles.profit_loss) missingDocs.push("Profit & Loss Statement");
    if (!uploadedFiles.business_plan) missingDocs.push("Business Plan");
    if (missingDocs.length > 0) {
      toast.error(`Please upload the following required documents before submitting: ${missingDocs.join(", ")}`);
      return;
    }

    // Flush any pending auto-save before submitting
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    const payload = buildSavePayload();
    if (payload) {
      setSaving(true);
      try {
        await saveMutation.mutateAsync(payload);
        setLastSaved(new Date());
      } catch (_) {
        setSaving(false);
        toast.error("Failed to save your responses. Please try again.");
        return;
      }
      setSaving(false);
    }

    try {
      await submitMutation.mutateAsync({ applicationId });
      navigate("/apply/confirmation");
    } catch (err: any) {
      const msg = err?.message ?? "Submission failed. Please check all required fields.";
      toast.error(msg);
    }
  };

  // ── Deadline passed ──
  if (deadlineQuery.data?.isPassed) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--cream)" }}>
        <div className="text-center max-w-md mx-auto px-6">
          <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h1 className="font-display text-3xl font-semibold mb-3" style={{ color: "var(--navy-900)" }}>
            Applications Are Closed
          </h1>
          <p className="text-muted-foreground mb-6">
            The application deadline of July 31 at 11:59 PM CT has passed. Thank you for your interest in the RISEhigHER Elevation Award.
          </p>
          <Button onClick={() => navigate("/")} variant="outline">Return to Home</Button>
        </div>
      </div>
    );
  }

  if (authLoading || getOrCreate.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--cream)" }}>
      {/* Header */}
      <div
        className="border-b sticky top-0 z-40"
        style={{ backgroundColor: "var(--navy-950)", borderColor: "oklch(100% 0 0 / 0.08)" }}
      >
        <div className="container flex items-center justify-between h-14">
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <Trophy className="w-4 h-4" style={{ color: "var(--gold-500)" }} />
            <span className="font-display text-white font-semibold text-sm">RISEhigHER Elevation Award</span>
          </button>
          <div className="flex items-center gap-3">
            {saving ? (
              <span className="text-white/40 text-xs flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Saving…
              </span>
            ) : lastSaved ? (
              <span className="text-white/40 text-xs flex items-center gap-1">
                <Save className="w-3 h-3" /> Saved
              </span>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs border-white/20 text-white hover:bg-white/10 hover:text-white"
              style={{ backgroundColor: "transparent" }}
              onClick={async () => {
                const payload = buildSavePayload();
                if (payload) {
                  setSaving(true);
                  try {
                    await saveMutation.mutateAsync(payload);
                    setLastSaved(new Date());
                    setSaving(false);
                    toast.success("Progress saved! You can return anytime to continue.");
                    navigate("/");
                  } catch (_) {
                    setSaving(false);
                    toast.error("Save failed — please try again before leaving.");
                  }
                } else {
                  // No applicationId yet (very early load) — just go home
                  navigate("/");
                }
              }}
            >
              <Save className="w-3 h-3" />
              Save &amp; Exit
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-10 max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl sm:text-4xl font-semibold mb-1" style={{ color: "var(--navy-900)" }}>
            Application
          </h1>
          <p className="text-muted-foreground text-sm">$1,000 Small Business Award · Deadline: July 31 at 11:59 PM CT</p>
        </div>

        <StepIndicator current={step} completed={completedSteps} />

        {/* ── Disqualification Gate ── */}
        {disqualified && (
          <div
            className="rounded-2xl p-8 mb-6 text-center"
            style={{ backgroundColor: "oklch(55% 0.22 25 / 0.08)", border: "1px solid oklch(55% 0.22 25 / 0.3)" }}
          >
            <AlertCircle className="w-10 h-10 mx-auto mb-4 text-red-500" />
            <h2 className="font-display text-2xl font-semibold mb-3" style={{ color: "var(--navy-900)" }}>
              Ineligible to Proceed
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Based on your responses in Part II, you do not currently meet all eligibility requirements for the RISEhigHER Elevation Award. All six certifications must be confirmed to submit an application.
            </p>
            <Button variant="outline" onClick={() => setDisqualified(false)}>
              Review My Answers
            </Button>
          </div>
        )}

        {!disqualified && (
          <div className="bg-white rounded-2xl shadow-sm border p-8" style={{ borderColor: "var(--border)" }}>
            {/* ── Part I ── */}
            {step === 0 && (
              <div className="space-y-6">
                <div>
                  <Badge variant="outline" className="mb-4 text-xs tracking-widest uppercase">Part I</Badge>
                  <h2 className="font-display text-2xl font-semibold" style={{ color: "var(--navy-900)" }}>Business Information</h2>
                  <p className="text-muted-foreground text-sm mt-1">Provide your business's legal and contact details.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label>Legal Business Name <span className="text-red-500">*</span></Label>
                    <Input value={legalBusinessName} onChange={(e) => setLegalBusinessName(e.target.value)} placeholder="As registered with the state or county" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>DBA (if applicable)</Label>
                    <Input value={dba} onChange={(e) => setDba(e.target.value)} placeholder="Doing Business As" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Entity Type <span className="text-red-500">*</span></Label>
                    <Select value={entityType} onValueChange={setEntityType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select entity type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="llc">LLC</SelectItem>
                        <SelectItem value="corporation">Corporation</SelectItem>
                        <SelectItem value="sole_proprietorship">Sole Proprietorship with DBA</SelectItem>
                        <SelectItem value="nonprofit">Nonprofit</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {entityType === "other" && (
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label>Specify Entity Type</Label>
                      <Input value={entityTypeOther} onChange={(e) => setEntityTypeOther(e.target.value)} />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label>State of Registration <span className="text-red-500">*</span></Label>
                    <Input value={stateOfRegistration} onChange={(e) => setStateOfRegistration(e.target.value)} placeholder="e.g., Texas" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Date of Formation <span className="text-red-500">*</span></Label>
                    <Input value={dateOfFormation} onChange={(e) => setDateOfFormation(e.target.value)} placeholder="MM/DD/YYYY" />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label>Principal Business Address <span className="text-red-500">*</span></Label>
                    <Input value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} placeholder="Street, City, State, ZIP" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Authorized Representative Name <span className="text-red-500">*</span></Label>
                    <Input value={repName} onChange={(e) => setRepName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Title</Label>
                    <Input value={repTitle} onChange={(e) => setRepTitle(e.target.value)} placeholder="e.g., Owner, CEO" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email Address <span className="text-red-500">*</span></Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Telephone Number</Label>
                    <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label>
                      Brief Description of Products or Services{" "}
                      <span className="text-muted-foreground text-xs">(25 words max)</span>
                      <span className="text-red-500"> *</span>
                    </Label>
                    <WordCountedTextarea
                      value={businessDescription}
                      onChange={setBusinessDescription}
                      maxWords={25}
                      placeholder="Describe what your business offers in 25 words or fewer"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── Part II ── */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <Badge variant="outline" className="mb-4 text-xs tracking-widest uppercase">Part II</Badge>
                  <h2 className="font-display text-2xl font-semibold" style={{ color: "var(--navy-900)" }}>Eligibility Certifications</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    All six certifications must be confirmed to proceed. Answering "No" to any item will disqualify your application.
                  </p>
                </div>
                <div className="space-y-4">
                  {[
                    { id: "certMember", state: certMember, setter: setCertMember, label: "I certify that the applicant is a member of the RISEhigHER Network community. (Enrollment in a coaching program is not required.)" },
                    { id: "certRegistered", state: certRegistered, setter: setCertRegistered, label: "I certify that the applicant entity maintains an active business registration in good standing." },
                    { id: "certBankAccount", state: certBankAccount, setter: setCertBankAccount, label: "I certify that the applicant entity maintains a depository account titled in the legal name of the business." },
                    { id: "certNetProfit", state: certNetProfit, setter: setCertNetProfit, label: "I certify that the applicant entity reported net profit not exceeding $5,000 for the most recent completed calendar quarter." },
                    { id: "certNoW2", state: certNoW2, setter: setCertNoW2, label: "I certify that the applicant entity employs no W-2 personnel. (Independent contractors compensated via Form 1099 are excluded.)" },
                    { id: "certBusinessPlan", state: certBusinessPlan, setter: setCertBusinessPlan, label: "I certify that the applicant entity maintains a current written business plan." },
                  ].map(({ id, state, setter, label }) => (
                    <div
                      key={id}
                      className="flex items-start gap-4 p-4 rounded-xl border transition-colors"
                      style={{
                        borderColor: state ? "var(--gold-500)" : "var(--border)",
                        backgroundColor: state ? "oklch(72% 0.13 75 / 0.05)" : "transparent",
                      }}
                    >
                      <Checkbox
                        id={id}
                        checked={state}
                        onCheckedChange={(v) => setter(v === true)}
                        className="mt-0.5"
                      />
                      <label htmlFor={id} className="text-sm leading-relaxed cursor-pointer" style={{ color: "var(--navy-800)" }}>
                        {label}
                      </label>
                    </div>
                  ))}
                </div>
                <div
                  className="p-4 rounded-xl text-sm"
                  style={{ backgroundColor: "oklch(55% 0.22 25 / 0.06)", color: "var(--navy-800)" }}
                >
                  <strong>Important:</strong> If you cannot certify all six items above, you are not eligible to apply for this award. Proceeding with false certifications constitutes grounds for disqualification.
                </div>
              </div>
            )}

            {/* ── Part III ── */}
            {step === 2 && (
              <div className="space-y-8">
                <div>
                  <Badge variant="outline" className="mb-4 text-xs tracking-widest uppercase">Part III</Badge>
                  <h2 className="font-display text-2xl font-semibold" style={{ color: "var(--navy-900)" }}>Organizational Narratives</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    This section carries the greatest weight in evaluation. Write so the review panel can picture your business, your customer, and your future.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold" style={{ color: "var(--navy-900)" }}>
                    Customer Impact Narrative <span className="text-red-500">*</span>
                    <span className="font-normal text-muted-foreground ml-1">(200 words max)</span>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Describe a typical day for one customer your business serves. Tell us who they are, the challenge they wake up with, how your product or service meets it, and what relief or change they experience as a result.
                  </p>
                  <WordCountedTextarea
                    value={customerImpactNarrative}
                    onChange={setCustomerImpactNarrative}
                    maxWords={200}
                    rows={7}
                    placeholder="Be specific enough that the review panel can picture this person…"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold" style={{ color: "var(--navy-900)" }}>
                    Operating History <span className="text-red-500">*</span>
                    <span className="font-normal text-muted-foreground ml-1">(150 words max)</span>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Walk us through your business's journey from launch to today. Include customers served, revenue generated, or milestones reached, and one obstacle you overcame to get here.
                  </p>
                  <WordCountedTextarea
                    value={operatingHistory}
                    onChange={setOperatingHistory}
                    maxWords={150}
                    rows={6}
                    placeholder="From launch to today…"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold" style={{ color: "var(--navy-900)" }}>
                    Founder Narrative & Timeliness <span className="text-red-500">*</span>
                    <span className="font-normal text-muted-foreground ml-1">(150 words max)</span>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Tell us why you are the person to run this business and why this moment matters. Indicate whether you operate the business full time or part time.
                  </p>
                  <WordCountedTextarea
                    value={founderNarrative}
                    onChange={setFounderNarrative}
                    maxWords={150}
                    rows={6}
                    placeholder="Why you, why now…"
                  />
                  <div className="pt-2">
                    <Label className="text-sm font-medium mb-2 block">Operation Mode <span className="text-red-500">*</span></Label>
                    <RadioGroup
                      value={operationMode}
                      onValueChange={(v) => setOperationMode(v as any)}
                      className="flex gap-6"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="full_time" id="full_time" />
                        <label htmlFor="full_time" className="text-sm cursor-pointer">Full Time</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="part_time" id="part_time" />
                        <label htmlFor="part_time" className="text-sm cursor-pointer">Part Time</label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>
            )}

            {/* ── Part IV ── */}
            {step === 3 && (
              <div className="space-y-8">
                <div>
                  <Badge variant="outline" className="mb-4 text-xs tracking-widest uppercase">Part IV</Badge>
                  <h2 className="font-display text-2xl font-semibold" style={{ color: "var(--navy-900)" }}>Use of Funds & Projected Outcomes</h2>
                </div>

                {/* Budget Builder */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold" style={{ color: "var(--navy-900)" }}>
                      Itemized Budget <span className="text-red-500">*</span>
                    </Label>
                    <span
                      className="text-sm font-semibold"
                      style={{
                        color: Math.round(budgetItems.reduce((s, b) => s + (b.amount || 0), 0)) === 1000
                          ? "oklch(55% 0.18 145)"
                          : Math.round(budgetItems.reduce((s, b) => s + (b.amount || 0), 0)) > 1000
                          ? "var(--destructive)"
                          : "var(--muted-foreground)",
                      }}
                    >
                      Total: ${budgetItems.reduce((s, b) => s + (b.amount || 0), 0).toFixed(2)} / $1,000.00
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Detail how the $1,000 award will be expended. Each line item must include a dollar amount and description. The total must equal $1,000.
                  </p>
                  <div className="space-y-2">
                    {budgetItems.map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="flex-1">
                          <Input
                            value={item.description}
                            onChange={(e) => {
                              const updated = [...budgetItems];
                              updated[i] = { ...updated[i], description: e.target.value };
                              setBudgetItems(updated);
                            }}
                            placeholder="Description (e.g., Website redesign)"
                          />
                        </div>
                        <div className="w-32">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.amount || ""}
                              onChange={(e) => {
                                const updated = [...budgetItems];
                                updated[i] = { ...updated[i], amount: parseFloat(e.target.value) || 0 };
                                setBudgetItems(updated);
                              }}
                              className="pl-6"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive flex-shrink-0"
                          onClick={() => setBudgetItems(budgetItems.filter((_, j) => j !== i))}
                          disabled={budgetItems.length === 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBudgetItems([...budgetItems, { description: "", amount: 0, sortOrder: budgetItems.length }])}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Line Item
                  </Button>
                </div>

                {/* 90-Day Impact */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold" style={{ color: "var(--navy-900)" }}>
                    The 90-Day Impact <span className="text-red-500">*</span>
                    <span className="font-normal text-muted-foreground ml-1">(150 words max)</span>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Describe what is different about your business 90 days after receiving this award. Identify the specific, measurable milestone the funds unlock, and explain the impact on your business. How will you demonstrate this impact was achieved?
                  </p>
                  <WordCountedTextarea
                    value={ninetyDayImpact}
                    onChange={setNinetyDayImpact}
                    maxWords={150}
                    rows={6}
                    placeholder="What changes in your revenue, capacity, customer reach, or ability to operate…"
                  />
                </div>
              </div>
            )}

            {/* ── Part V ── */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <Badge variant="outline" className="mb-4 text-xs tracking-widest uppercase">Part V</Badge>
                  <h2 className="font-display text-2xl font-semibold" style={{ color: "var(--navy-900)" }}>Supporting Documentation</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    All four documents are required. Upload PDF files only (max 10 MB each). Account numbers and balances on bank documents must be redacted.
                  </p>
                </div>

                {([
                  {
                    key: "formation_doc" as const,
                    title: "Business Formation Document",
                    desc: "Certificate of Formation, Articles of Incorporation, or county assumed name filing",
                  },
                  {
                    key: "bank_account" as const,
                    title: "Business Bank Account Evidence",
                    desc: "Bank-issued verification letter, voided business check, or first page of a recent account statement (account numbers and balances must be redacted)",
                  },
                  {
                    key: "profit_loss" as const,
                    title: "Profit & Loss Statement",
                    desc: "For the most recent completed calendar quarter",
                  },
                  {
                    key: "business_plan" as const,
                    title: "Current Business Plan",
                    desc: "PDF format",
                  },
                ] as const).map(({ key, title, desc }) => (
                  <div
                    key={key}
                    className="p-5 rounded-xl border"
                    style={{
                      borderColor: uploadedFiles[key] ? "var(--gold-500)" : "var(--border)",
                      backgroundColor: uploadedFiles[key] ? "oklch(72% 0.13 75 / 0.04)" : "transparent",
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {uploadedFiles[key] ? (
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "var(--gold-500)" }} />
                          ) : (
                            <FileText className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                          )}
                          <span className="font-medium text-sm" style={{ color: "var(--navy-900)" }}>{title}</span>
                          <Badge variant="outline" className="text-xs text-red-500 border-red-200">Required</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground ml-6">{desc}</p>
                        {uploadedFiles[key] && (
                          <p className="text-xs ml-6 mt-1" style={{ color: "var(--gold-500)" }}>
                            ✓ {uploadedFiles[key]!.name}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(key, file);
                              e.target.value = "";
                            }}
                            disabled={uploadingFile === key}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="pointer-events-none"
                            disabled={uploadingFile === key}
                          >
                            {uploadingFile === key ? (
                              <Loader2 className="w-3 h-3 animate-spin mr-1" />
                            ) : (
                              <Upload className="w-3 h-3 mr-1" />
                            )}
                            {uploadedFiles[key] ? "Replace" : "Upload PDF"}
                          </Button>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Part VI ── */}
            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <Badge variant="outline" className="mb-4 text-xs tracking-widest uppercase">Part VI</Badge>
                  <h2 className="font-display text-2xl font-semibold" style={{ color: "var(--navy-900)" }}>Certifications & Signature</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    By signing below, the authorized representative certifies all of the following.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    { id: "certAccuracy", state: certAccuracy, setter: setCertAccuracy, label: "All statements and documentation submitted are true, accurate, and complete, and any material misrepresentation constitutes grounds for disqualification or forfeiture of the award." },
                    { id: "certAgreement", state: certAgreement, setter: setCertAgreement, label: "The applicant has read and agrees to the Official Rules and published evaluation criteria." },
                    { id: "certConsent", state: certConsent, setter: setCertConsent, label: "The applicant consents to the use of the business name, founder name, and likeness in award announcements and promotional materials, and to inclusion in communications from the Sponsor and the RISEhigHER Network." },
                    { id: "certW9", state: certW9, setter: setCertW9, label: "If selected, the applicant will furnish a completed IRS Form W-9 prior to disbursement and will submit the 90 Day Impact Kit as described in the Official Rules." },
                  ].map(({ id, state, setter, label }) => (
                    <div
                      key={id}
                      className="flex items-start gap-4 p-4 rounded-xl border transition-colors"
                      style={{
                        borderColor: state ? "var(--gold-500)" : "var(--border)",
                        backgroundColor: state ? "oklch(72% 0.13 75 / 0.05)" : "transparent",
                      }}
                    >
                      <Checkbox
                        id={id}
                        checked={state}
                        onCheckedChange={(v) => setter(v === true)}
                        className="mt-0.5"
                      />
                      <label htmlFor={id} className="text-sm leading-relaxed cursor-pointer" style={{ color: "var(--navy-800)" }}>
                        {label}
                      </label>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                  <div className="space-y-1.5">
                    <Label>Signature (Printed Name) <span className="text-red-500">*</span></Label>
                    <Input
                      value={signatureName}
                      onChange={(e) => setSignatureName(e.target.value)}
                      placeholder="Type your full legal name"
                      className="font-display text-lg italic"
                      style={{ fontFamily: "'Cormorant Garamond', serif" }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Date <span className="text-red-500">*</span></Label>
                    <Input
                      type="date"
                      value={signatureDate}
                      onChange={(e) => setSignatureDate(e.target.value)}
                    />
                  </div>
                </div>

                <div
                  className="p-4 rounded-xl text-sm"
                  style={{ backgroundColor: "oklch(18% 0.05 250 / 0.05)", color: "var(--navy-800)" }}
                >
                  By submitting this application, you agree to be bound by the Official Rules of the RISEhigHER Elevation Award. This contest is governed by the laws of the State of Texas.
                </div>
              </div>
            )}

            {/* ── Support Link ── */}
            <div className="mt-8 text-center">
              <p className="text-xs text-muted-foreground">
                Having trouble?{" "}
                <a
                  href="mailto:jennifer@bookmcg.com?subject=RISEhigHER%20Elevation%20Award%20Application%20Support"
                  className="underline underline-offset-2 hover:opacity-80 transition-opacity"
                  style={{ color: "var(--navy-700)" }}
                >
                  Contact support
                </a>
                {" "}&mdash; we’re here to help before the July 31 deadline.
              </p>
            </div>

            {/* ── Navigation ── */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t" style={{ borderColor: "var(--border)" }}>
              <Button
                variant="outline"
                onClick={step === 0 ? () => navigate("/") : handleBack}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                {step === 0 ? "Back to Home" : "Previous"}
              </Button>

              {step < 5 ? (
                <Button
                  onClick={handleNext}
                  className="gap-2 font-semibold"
                  style={{ backgroundColor: "var(--navy-900)", color: "white" }}
                >
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending || saving || !!uploadingFile || !certAccuracy || !certAgreement || !certConsent || !certW9 || !signatureName || !signatureDate}
                  className="gap-2 font-semibold px-8"
                  style={{ backgroundColor: "var(--gold-500)", color: "var(--navy-950)" }}
                >
                  {submitMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                  ) : (
                    <><CheckCircle2 className="w-4 h-4" /> Submit Application</>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
