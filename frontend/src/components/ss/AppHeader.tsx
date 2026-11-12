import { Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { setUser, type User } from "@/lib/store";
export function AppHeader({ user }: { user: User | null }) {
  const nav = useNavigate();
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Logo />
        <div className="flex items-center gap-3 text-sm">
          <ThemeToggle />
          {user && (
            <span className="hidden text-muted-foreground sm:inline">
              {user.email}
            </span>
          )}
          <button
            onClick={() => {
              setUser(null);
              nav({ to: "/login", replace: true });
            }}
            className="rounded px-2 py-1 text-muted-foreground hover:text-foreground"
          >
            Log out
          </button>
          <Link to="/dashboard" className="sr-only">
            Dashboard
          </Link>
        </div>
      </div>
    </header>
  );
}
