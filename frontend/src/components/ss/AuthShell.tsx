import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Logo } from "./Logo";
export function AuthShell({
  title,
  sub,
  children,
}: {
  title: string;
  sub: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-glow px-4 py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to StreamSync
      </Link>
      <div className="mx-auto mt-16 w-full max-w-sm">
        <Logo />
        <h1 className="mt-8 text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
export function Field({
  label,
  error,
  id,
  type = "text",
  value,
  onChange,
  right,
  autoComplete,
}: {
  label: string;
  error?: string | undefined;
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  right?: ReactNode;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  const isPw = type === "password";
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <label htmlFor={id} className="font-medium">
          {label}
        </label>
        {right}
      </div>
      <div className="relative">
        <input
          id={id}
          type={isPw && show ? "text" : type}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
          className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring aria-[invalid=true]:border-destructive"
        />
        {isPw && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
          >
            {show ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-err`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
export const btn =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors disabled:opacity-50";
export const btnPrimary = `${btn} bg-primary text-primary-foreground hover:bg-primary-hover`;
export const btnGhost = `${btn} border border-border bg-secondary text-secondary-foreground hover:bg-accent`;
