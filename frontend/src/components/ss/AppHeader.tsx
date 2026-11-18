import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

export function AppHeader({ name }: { name: string }) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Logo />
        <div className="flex items-center gap-3 text-sm">
          <ThemeToggle />
          <span className="hidden text-muted-foreground sm:inline">{name}</span>
        </div>
      </div>
    </header>
  );
}
