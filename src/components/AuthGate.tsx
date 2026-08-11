import { type ReactNode } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, LockKeyhole } from "lucide-react";
import { useAuth, type Role } from "@/_core/hooks/useAuth";

interface AuthGateProps {
  children: ReactNode;
  /** Roles allowed to view. Omit to allow any signed-in user. */
  allow?: Role[];
  /** Role assumed when the user signs in from this gate. */
  signInAs?: Role;
  title?: string;
  description?: string;
}

// Guards a page: shows a loading state while the session resolves, a sign-in
// card when unauthenticated (storing the return path so PostLoginRedirect
// brings the user back here), and an access notice on role mismatch.
export default function AuthGate({
  children,
  allow,
  signInAs = "applicant",
  title = "Sign in to continue",
  description = "You need to be signed in to access this page.",
}: AuthGateProps) {
  const { user, loading, login } = useAuth();
  const [location] = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="grid min-h-[70vh] place-items-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="items-center text-center">
            <span className="mb-2 grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              <LockKeyhole className="h-6 w-6" />
            </span>
            <CardTitle>{title}</CardTitle>
            <p className="text-sm text-muted-foreground">{description}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full"
              onClick={() => {
                sessionStorage.setItem("postLoginReturnPath", location);
                login({ role: signInAs, viaRedirect: true });
              }}
            >
              Continue with Google
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Demo sign-in — no real account required. You'll return here after
              signing in.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (allow && !allow.includes(user.role)) {
    return (
      <div className="grid min-h-[70vh] place-items-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="items-center text-center">
            <CardTitle>Access restricted</CardTitle>
            <p className="text-sm text-muted-foreground">
              This area is limited to {allow.join(" / ")} accounts. You're
              signed in as <strong>{user.role}</strong>.
            </p>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
