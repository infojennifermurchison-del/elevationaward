import { Link } from "wouter";
import { CheckCircle2, ArrowRight } from "lucide-react";
import Page from "@/components/Page";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/_core/useStore";
import { getApplication } from "@/_core/store";

export default function ApplicationConfirmation() {
  const lastId = sessionStorage.getItem("lastApplicationId") ?? "";
  const app = useStore(() => (lastId ? getApplication(lastId) : undefined));

  return (
    <Page>
      <div className="mx-auto max-w-lg py-8 text-center">
        <span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-emerald-500/10 text-emerald-500">
          <CheckCircle2 className="h-9 w-9" />
        </span>
        <h1 className="text-3xl font-bold tracking-tight">
          Application received
        </h1>
        <p className="mt-2 text-muted-foreground">
          Thank you for applying to the Elevation Award. Our panel will review
          your submission and follow up by email.
        </p>

        {app && (
          <Card className="mt-6 text-left">
            <CardContent className="space-y-2 py-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Reference
                </span>
                <span className="font-mono text-sm">{app.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Project</span>
                <span className="text-sm font-medium">{app.title}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Category</span>
                <span className="text-sm">{app.category}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 flex justify-center gap-3">
          <Button asChild variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
          <Button asChild>
            <Link href="/apply">
              Submit another <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </Page>
  );
}
