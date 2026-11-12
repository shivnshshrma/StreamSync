import { Link } from "@tanstack/react-router";
export function Logo() {
  return (
    <Link
      to="/"
      className="flex items-center gap-2 font-semibold tracking-tight text-foreground"
    >
      <span
        aria-hidden
        className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
          <path d="M7 5v14l6-4.5V19l7-7-7-7v4.5z" />
        </svg>
      </span>
      StreamSync
    </Link>
  );
}
