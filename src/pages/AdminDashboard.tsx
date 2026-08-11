import { Link } from "wouter";
import { Users, FileText, Trophy, ArrowRight } from "lucide-react";
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
import { useStore } from "@/_core/useStore";
import {
  getApplications,
  getEvaluators,
  averageScore,
  getScoresForApplication,
  type ApplicationStatus,
} from "@/_core/store";
import { formatDate } from "@/lib/utils";

const STATUS_META: Record<
  ApplicationStatus,
  { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" | "outline" }
> = {
  submitted: { label: "Submitted", variant: "secondary" },
  under_review: { label: "Under review", variant: "warning" },
  scored: { label: "Scored", variant: "default" },
  awarded: { label: "Awarded", variant: "success" },
  rejected: { label: "Rejected", variant: "destructive" },
};

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-2xl font-bold leading-tight">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const applications = useStore(getApplications);
  const evaluators = useStore(getEvaluators);
  const awarded = applications.filter((a) => a.status === "awarded").length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Review applications and manage the evaluation panel.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/evaluators">
            <Users /> Evaluators
          </Link>
        </Button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={FileText} label="Applications" value={applications.length} />
        <StatCard icon={Users} label="Evaluators" value={evaluators.length} />
        <StatCard icon={Trophy} label="Awarded" value={awarded} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {applications.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No applications yet.
            </p>
          ) : (
            <div className="divide-y">
              {applications.map((app) => {
                const meta = STATUS_META[app.status];
                const avg = averageScore(app.id);
                const scoreCount = getScoresForApplication(app.id).length;
                return (
                  <Link
                    key={app.id}
                    href={`/admin/application/${app.id}`}
                    className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-accent/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{app.title}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {app.applicantName} · {app.category} ·{" "}
                        {formatDate(app.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {avg !== null && (
                        <span className="text-sm text-muted-foreground">
                          {avg.toFixed(1)}/40 · {scoreCount} score
                          {scoreCount === 1 ? "" : "s"}
                        </span>
                      )}
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <Page>
      <AuthGate
        allow={["admin"]}
        signInAs="admin"
        title="Admin sign in"
        description="Sign in with an administrator account to continue."
      >
        <Dashboard />
      </AuthGate>
    </Page>
  );
}
