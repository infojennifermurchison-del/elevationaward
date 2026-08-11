import { useMemo } from "react";
import { Link, useLocation } from "wouter";
import { UserCheck, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import Page from "@/components/Page";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useStore } from "@/_core/useStore";
import { getEvaluatorByEmail, acceptInvite } from "@/_core/store";
import { useAuth } from "@/_core/hooks/useAuth";

export default function EvaluatorAccept() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const email = useMemo(
    () => new URLSearchParams(window.location.search).get("email") ?? "",
    [],
  );
  const evaluator = useStore(() =>
    email ? getEvaluatorByEmail(email) : undefined,
  );

  const accept = () => {
    if (!evaluator) return;
    acceptInvite(evaluator.email);
    login({
      role: "evaluator",
      email: evaluator.email,
      name: evaluator.name,
    });
    toast.success("Invitation accepted");
    navigate("/evaluator");
  };

  return (
    <Page>
      <div className="mx-auto max-w-md py-10">
        <Card>
          <CardHeader className="items-center text-center">
            <span className="mb-2 grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              <UserCheck className="h-6 w-6" />
            </span>
            <CardTitle>Evaluator invitation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            {!email ? (
              <p className="text-sm text-muted-foreground">
                This invite link is missing an email. Please use the link sent
                to you.
              </p>
            ) : !evaluator ? (
              <p className="text-sm text-muted-foreground">
                We couldn't find an invitation for <strong>{email}</strong>.
                Please contact the program administrator.
              </p>
            ) : evaluator.status === "active" ? (
              <>
                <p className="text-sm text-muted-foreground">
                  You've already accepted your invitation,{" "}
                  <strong>{evaluator.name}</strong>.
                </p>
                <Button
                  className="w-full"
                  onClick={() => {
                    login({
                      role: "evaluator",
                      email: evaluator.email,
                      name: evaluator.name,
                    });
                    navigate("/evaluator");
                  }}
                >
                  Go to evaluator portal <ArrowRight />
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Hi <strong>{evaluator.name}</strong>, you've been invited to
                  join the Elevation Award evaluation panel. Accept to start
                  reviewing assigned applications.
                </p>
                <Button className="w-full" onClick={accept}>
                  Accept invitation <ArrowRight />
                </Button>
              </>
            )}
            <Button asChild variant="ghost" size="sm">
              <Link href="/">Back to home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
