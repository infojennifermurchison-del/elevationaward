import { Link } from "wouter";
import { ClipboardList, CheckCircle2, ArrowRight } from "lucide-react";
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
import { getAssignmentsForEvaluator, hasScored } from "@/_core/store";
import { useAuth } from "@/_core/hooks/useAuth";

function Portal() {
  const { user } = useAuth();
  const email = user?.email ?? "";
  const assignments = useStore(() => getAssignmentsForEvaluator(email));

  const pending = assignments.filter((a) => !hasScored(a.id, email));
  const completed = assignments.filter((a) => hasScored(a.id, email));

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Evaluator portal</h1>
        <p className="mt-1 text-muted-foreground">
          Welcome, {user?.name}. Review and score the applications assigned to
          you.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-amber-500/10 text-amber-500">
              <ClipboardList className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-bold leading-tight">
                {pending.length}
              </p>
              <p className="text-sm text-muted-foreground">Awaiting your score</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-5">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-bold leading-tight">
                {completed.length}
              </p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Assigned applications</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {assignments.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              You have no assigned applications yet. An administrator will assign
              entries for you to review.
            </p>
          ) : (
            <div className="divide-y">
              {assignments.map((app) => {
                const scored = hasScored(app.id, email);
                return (
                  <div
                    key={app.id}
                    className="flex items-center justify-between gap-4 px-6 py-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{app.title}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {app.applicantName} · {app.category}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {scored ? (
                        <Badge variant="success">Scored</Badge>
                      ) : (
                        <Button asChild size="sm">
                          <Link href={`/evaluator/score/${app.id}`}>
                            Score <ArrowRight />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function EvaluatorPortal() {
  return (
    <Page>
      <AuthGate
        allow={["evaluator", "admin"]}
        signInAs="evaluator"
        title="Evaluator sign in"
        description="Sign in with your evaluator account to view assignments."
      >
        <Portal />
      </AuthGate>
    </Page>
  );
}
