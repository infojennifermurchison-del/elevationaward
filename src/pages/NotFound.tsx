import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 text-center">
      <div className="space-y-4">
        <p className="text-7xl font-bold text-primary">404</p>
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="max-w-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button asChild>
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
