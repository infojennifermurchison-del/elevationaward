import { Link } from "wouter";
import {
  Award,
  ArrowRight,
  ClipboardCheck,
  Users,
  Trophy,
} from "lucide-react";
import Page from "@/components/Page";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { useStore } from "@/_core/useStore";
import { getApplications } from "@/_core/store";

const STEPS = [
  {
    icon: ClipboardCheck,
    title: "Apply",
    body: "Tell us about your project, its impact, and the change it drives.",
  },
  {
    icon: Users,
    title: "Get evaluated",
    body: "An independent panel scores each entry against clear criteria.",
  },
  {
    icon: Trophy,
    title: "Get elevated",
    body: "Standout applications are recognized and awarded to grow further.",
  },
];

export default function Home() {
  const { user, login } = useAuth();
  const count = useStore(() => getApplications().length);

  return (
    <Page>
      <section className="mx-auto max-w-3xl py-12 text-center">
        <span className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border bg-secondary px-4 py-1.5 text-sm font-medium">
          <Award className="h-4 w-4 text-primary" />
          Recognizing work that lifts communities
        </span>
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          The Elevation Award
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-balance text-lg text-muted-foreground">
          A recognition program for projects creating measurable impact. Submit
          your work, get evaluated by an expert panel, and rise.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/apply">
              Start an application <ArrowRight />
            </Link>
          </Button>
          {!user && (
            <Button
              variant="outline"
              size="lg"
              onClick={() => login({ role: "applicant" })}
            >
              Sign in
            </Button>
          )}
        </div>
        {count > 0 && (
          <p className="mt-6 text-sm text-muted-foreground">
            {count} application{count === 1 ? "" : "s"} in this cycle
          </p>
        )}
      </section>

      <section className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
        {STEPS.map((step) => (
          <Card key={step.title}>
            <CardHeader>
              <span className="mb-2 grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
                <step.icon className="h-5 w-5" />
              </span>
              <CardTitle className="text-lg">{step.title}</CardTitle>
              <CardDescription>{step.body}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="mx-auto mt-10 max-w-4xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
            <div>
              <p className="font-semibold">Ready to submit your project?</p>
              <p className="text-sm text-muted-foreground">
                Applications take about 10 minutes to complete.
              </p>
            </div>
            <Button asChild>
              <Link href="/apply">
                Apply now <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </Page>
  );
}
