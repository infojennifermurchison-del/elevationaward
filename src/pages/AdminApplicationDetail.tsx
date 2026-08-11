import { Link, useParams } from "wouter";
import { ArrowLeft, Mail, Building2 } from "lucide-react";
import { toast } from "sonner";
import Page from "@/components/Page";
import AuthGate from "@/components/AuthGate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useStore } from "@/_core/useStore";
import {
  getApplication,
  getEvaluators,
  getScoresForApplication,
  averageScore,
  assignEvaluator,
  unassignEvaluator,
  updateApplication,
  type ApplicationStatus,
} from "@/_core/store";
import { formatDate } from "@/lib/utils";

const STATUSES: ApplicationStatus[] = [
  "submitted",
  "under_review",
  "scored",
  "awarded",
  "rejected",
];

function Detail({ id }: { id: string }) {
  const app = useStore(() => getApplication(id));
  const evaluators = useStore(getEvaluators);
  const scores = useStore(() => getScoresForApplication(id));
  const avg = useStore(() => averageScore(id));

  if (!app) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-medium">Application not found</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/admin">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  const toggleAssign = (evaluatorId: string, assigned: boolean) => {
    if (assigned) {
      unassignEvaluator(app.id, evaluatorId);
    } else {
      assignEvaluator(app.id, evaluatorId);
      if (app.status === "submitted") {
        updateApplication(app.id, { status: "under_review" });
      }
    }
  };

  const changeStatus = (status: ApplicationStatus) => {
    updateApplication(app.id, { status });
    toast.success(`Status updated to “${status.replace("_", " ")}”`);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href="/admin">
          <ArrowLeft /> Back to dashboard
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{app.category}</p>
                  <CardTitle className="mt-1 text-2xl">{app.title}</CardTitle>
                </div>
                <Badge variant="outline">{app.status.replace("_", " ")}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  {app.applicantName}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-4 w-4" /> {app.email}
                </span>
                {app.organization && (
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="h-4 w-4" /> {app.organization}
                  </span>
                )}
                <span>Submitted {formatDate(app.createdAt)}</span>
              </div>
              <div>
                <h3 className="mb-1 text-sm font-semibold">Summary</h3>
                <p className="text-sm text-muted-foreground">{app.summary}</p>
              </div>
              {app.impact && (
                <div>
                  <h3 className="mb-1 text-sm font-semibold">Impact to date</h3>
                  <p className="text-sm text-muted-foreground">{app.impact}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-lg">
                Evaluations ({scores.length})
              </CardTitle>
              {avg !== null && (
                <span className="text-sm font-medium">
                  Average {avg.toFixed(1)}/40
                </span>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {scores.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No evaluations submitted yet.
                </p>
              ) : (
                scores.map((s) => {
                  const total =
                    s.criteria.innovation +
                    s.criteria.impact +
                    s.criteria.feasibility +
                    s.criteria.presentation;
                  return (
                    <div key={s.id} className="rounded-lg border p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-medium">{s.evaluatorName}</p>
                        <span className="text-sm font-semibold">
                          {total}/40
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
                        <span>Innovation {s.criteria.innovation}/10</span>
                        <span>Impact {s.criteria.impact}/10</span>
                        <span>Feasibility {s.criteria.feasibility}/10</span>
                        <span>Presentation {s.criteria.presentation}/10</span>
                      </div>
                      {s.comments && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          “{s.comments}”
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor="status">Update status</Label>
              <select
                id="status"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={app.status}
                onChange={(e) =>
                  changeStatus(e.target.value as ApplicationStatus)
                }
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assign evaluators</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {evaluators.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No evaluators yet.{" "}
                  <Link
                    href="/admin/evaluators"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Invite one
                  </Link>
                  .
                </p>
              ) : (
                evaluators.map((ev) => {
                  const assigned = ev.assignments.includes(app.id);
                  return (
                    <label
                      key={ev.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm hover:bg-accent/50"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-[hsl(var(--primary))]"
                        checked={assigned}
                        onChange={() => toggleAssign(ev.id, assigned)}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {ev.name}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {ev.email}
                        </span>
                      </span>
                      {ev.status === "invited" && (
                        <Badge variant="secondary">invited</Badge>
                      )}
                    </label>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function AdminApplicationDetail() {
  const params = useParams();
  return (
    <Page>
      <AuthGate
        allow={["admin"]}
        signInAs="admin"
        title="Admin sign in"
        description="Sign in with an administrator account to continue."
      >
        <Detail id={params.id ?? ""} />
      </AuthGate>
    </Page>
  );
}
