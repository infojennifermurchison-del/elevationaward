import { useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Page from "@/components/Page";
import AuthGate from "@/components/AuthGate";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useStore } from "@/_core/useStore";
import {
  getApplication,
  addScore,
  hasScored,
  type ScoreCriteria,
} from "@/_core/store";
import { useAuth } from "@/_core/hooks/useAuth";

const CRITERIA: { key: keyof ScoreCriteria; label: string; hint: string }[] = [
  { key: "innovation", label: "Innovation", hint: "Originality of the approach" },
  { key: "impact", label: "Impact", hint: "Depth and reach of outcomes" },
  {
    key: "feasibility",
    label: "Feasibility",
    hint: "Practicality and sustainability",
  },
  {
    key: "presentation",
    label: "Presentation",
    hint: "Clarity of the application",
  },
];

function ScoreForm({ id }: { id: string }) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const app = useStore(() => getApplication(id));
  const already = useStore(() =>
    user ? hasScored(id, user.email) : false,
  );

  const [criteria, setCriteria] = useState<ScoreCriteria>({
    innovation: 5,
    impact: 5,
    feasibility: 5,
    presentation: 5,
  });
  const [comments, setComments] = useState("");

  if (!app) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-medium">Application not found</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/evaluator">Back to portal</Link>
        </Button>
      </div>
    );
  }

  const total =
    criteria.innovation +
    criteria.impact +
    criteria.feasibility +
    criteria.presentation;

  const submit = () => {
    if (!user) return;
    addScore({
      applicationId: app.id,
      evaluatorEmail: user.email,
      evaluatorName: user.name,
      criteria,
      comments: comments.trim(),
    });
    toast.success("Score submitted");
    navigate("/evaluator");
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href="/evaluator">
          <ArrowLeft /> Back to portal
        </Link>
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <p className="text-sm text-muted-foreground">{app.category}</p>
          <CardTitle className="text-2xl">{app.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{app.summary}</p>
          {app.impact && (
            <div>
              <h3 className="mb-1 text-sm font-semibold">Impact to date</h3>
              <p className="text-sm text-muted-foreground">{app.impact}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {already ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="font-medium">You've already scored this application.</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/evaluator">Back to portal</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-lg">Your evaluation</CardTitle>
            <span className="text-sm font-semibold">{total}/40</span>
          </CardHeader>
          <CardContent className="space-y-6">
            {CRITERIA.map((c) => (
              <div key={c.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={c.key}>
                    {c.label}{" "}
                    <span className="font-normal text-muted-foreground">
                      — {c.hint}
                    </span>
                  </Label>
                  <span className="text-sm font-semibold tabular-nums">
                    {criteria[c.key]}/10
                  </span>
                </div>
                <input
                  id={c.key}
                  type="range"
                  min={1}
                  max={10}
                  value={criteria[c.key]}
                  onChange={(e) =>
                    setCriteria((prev) => ({
                      ...prev,
                      [c.key]: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-[hsl(var(--primary))]"
                />
              </div>
            ))}

            <div className="space-y-2">
              <Label htmlFor="comments">Comments</Label>
              <Textarea
                id="comments"
                rows={4}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Optional notes to support your score."
              />
            </div>

            <Button className="w-full" onClick={submit}>
              Submit evaluation
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function EvaluatorScore() {
  const params = useParams();
  return (
    <Page>
      <AuthGate
        allow={["evaluator", "admin"]}
        signInAs="evaluator"
        title="Evaluator sign in"
        description="Sign in with your evaluator account to score applications."
      >
        <ScoreForm id={params.id ?? ""} />
      </AuthGate>
    </Page>
  );
}
