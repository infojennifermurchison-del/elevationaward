import { useState, type FormEvent } from "react";
import { Link } from "wouter";
import { ArrowLeft, Trash2, Link2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import Page from "@/components/Page";
import AuthGate from "@/components/AuthGate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useStore } from "@/_core/useStore";
import {
  getEvaluators,
  addEvaluator,
  removeEvaluator,
} from "@/_core/store";
import { formatDate } from "@/lib/utils";

function Evaluators() {
  const evaluators = useStore(getEvaluators);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const invite = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Enter a name and email.");
      return;
    }
    addEvaluator(name.trim(), email.trim());
    toast.success(`Invited ${name.trim()}`);
    setName("");
    setEmail("");
  };

  const copyInvite = (evEmail: string) => {
    const url = `${window.location.origin}/evaluator/accept?email=${encodeURIComponent(
      evEmail,
    )}`;
    navigator.clipboard?.writeText(url).then(
      () => toast.success("Invite link copied"),
      () => toast.error("Could not copy link"),
    );
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href="/admin">
          <ArrowLeft /> Back to dashboard
        </Link>
      </Button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Evaluators</h1>
        <p className="mt-1 text-muted-foreground">
          Invite panelists and manage the evaluation team.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Invite an evaluator</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={invite} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="ev-name">Name</Label>
              <Input
                id="ev-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="ev-email">Email</Label>
              <Input
                id="ev-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@panel.org"
              />
            </div>
            <Button type="submit">
              <UserPlus /> Invite
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Panel ({evaluators.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {evaluators.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No evaluators yet.
            </p>
          ) : (
            <div className="divide-y">
              {evaluators.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center justify-between gap-4 px-6 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{ev.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {ev.email} · invited {formatDate(ev.invitedAt)} ·{" "}
                      {ev.assignments.length} assigned
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge
                      variant={ev.status === "active" ? "success" : "secondary"}
                    >
                      {ev.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Copy invite link"
                      onClick={() => copyInvite(ev.email)}
                    >
                      <Link2 />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remove evaluator"
                      onClick={() => {
                        removeEvaluator(ev.id);
                        toast.success(`Removed ${ev.name}`);
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminEvaluators() {
  return (
    <Page>
      <AuthGate
        allow={["admin"]}
        signInAs="admin"
        title="Admin sign in"
        description="Sign in with an administrator account to continue."
      >
        <Evaluators />
      </AuthGate>
    </Page>
  );
}
