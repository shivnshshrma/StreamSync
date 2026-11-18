import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "./Logo";
import { btnPrimary } from "./buttons";
import { getDisplayName, setDisplayName } from "@/lib/store";

/**
 * StreamSync has no accounts. Before a page that shows who you are, ask for a
 * display name once and keep it in this browser.
 */
export function NameGate({
  children,
}: {
  children: (name: string) => ReactNode;
}) {
  // undefined: not read yet (server render); null: no name saved.
  const [name, setName] = useState<string | null | undefined>(undefined);
  const [draft, setDraft] = useState("");
  useEffect(() => setName(getDisplayName()), []);

  if (name === undefined) return null;
  if (name) return <>{children(name)}</>;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    setDisplayName(trimmed);
    setName(trimmed);
  };
  return (
    <div className="min-h-screen bg-glow px-4 py-8">
      <form onSubmit={submit} className="mx-auto mt-24 w-full max-w-sm">
        <Logo />
        <h1 className="mt-8 text-2xl font-semibold tracking-tight">
          What should we call you?
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Other people in the room see this name. No account needed.
        </p>
        <label htmlFor="display-name" className="sr-only">
          Your name
        </label>
        <input
          id="display-name"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={100}
          autoFocus
          autoComplete="nickname"
          placeholder="Your name"
          className="mt-6 h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring"
        />
        <button
          className={btnPrimary + " mt-4 w-full"}
          disabled={!draft.trim()}
        >
          Continue
        </button>
      </form>
    </div>
  );
}
