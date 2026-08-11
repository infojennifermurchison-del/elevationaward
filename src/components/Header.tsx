import { Link, useLocation } from "wouter";
import { Award, Moon, Sun, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth, type Role } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  );
}

const NAV: { href: string; label: string; roles?: Role[] }[] = [
  { href: "/apply", label: "Apply" },
  { href: "/evaluator", label: "Evaluator", roles: ["evaluator", "admin"] },
  { href: "/admin", label: "Admin", roles: ["admin"] },
];

export default function Header() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const links = NAV.filter(
    (n) => !n.roles || (user && n.roles.includes(user.role)),
  );

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Award className="h-5 w-5" />
          </span>
          <span>Elevation Award</span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
                location.startsWith(link.href) &&
                  "bg-accent text-accent-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
          <ThemeToggle />
          {user ? (
            <div className="ml-2 flex items-center gap-2">
              <span
                className="grid h-8 w-8 place-items-center rounded-full text-sm font-semibold text-white"
                style={{ backgroundColor: user.avatarColor }}
                title={`${user.name} · ${user.role}`}
              >
                {user.name.charAt(0).toUpperCase()}
              </span>
              <Button variant="ghost" size="icon" aria-label="Sign out" onClick={() => logout()}>
                <LogOut />
              </Button>
            </div>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
