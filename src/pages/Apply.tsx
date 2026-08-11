import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import Page from "@/components/Page";
import AuthGate from "@/components/AuthGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { addApplication } from "@/_core/store";

const CATEGORIES = [
  "Community Impact",
  "Sustainability",
  "Health & Wellbeing",
  "Education",
  "Technology for Good",
];

function ApplyForm() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    applicantName: user?.name ?? "",
    email: user?.email ?? "",
    organization: "",
    category: CATEGORIES[0],
    title: "",
    summary: "",
    impact: "",
  });

  const update = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.summary.trim()) {
      toast.error("Please add a project title and summary.");
      return;
    }
    setSubmitting(true);
    const app = addApplication(form);
    sessionStorage.setItem("lastApplicationId", app.id);
    toast.success("Application submitted");
    navigate("/apply/confirmation");
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Apply for the Award</h1>
        <p className="mt-1 text-muted-foreground">
          Share your project. Fields marked with * are required.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project application</CardTitle>
          <CardDescription>
            Your submission will be reviewed by our evaluation panel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="applicantName">Your name *</Label>
                <Input
                  id="applicantName"
                  required
                  value={form.applicantName}
                  onChange={(e) => update("applicantName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                <Input
                  id="organization"
                  value={form.organization}
                  onChange={(e) => update("organization", e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={form.category}
                  onChange={(e) => update("category", e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Project title *</Label>
              <Input
                id="title"
                required
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="e.g. Mobile STEM Labs for Rural Schools"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Summary *</Label>
              <Textarea
                id="summary"
                required
                rows={4}
                value={form.summary}
                onChange={(e) => update("summary", e.target.value)}
                placeholder="What is the project and who does it serve?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="impact">Impact to date</Label>
              <Textarea
                id="impact"
                rows={4}
                value={form.impact}
                onChange={(e) => update("impact", e.target.value)}
                placeholder="Quantify outcomes where you can (people reached, results measured)."
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit application"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Apply() {
  return (
    <Page>
      <AuthGate
        signInAs="applicant"
        title="Sign in to apply"
        description="Sign in to start and save your application."
      >
        <ApplyForm />
      </AuthGate>
    </Page>
  );
}
