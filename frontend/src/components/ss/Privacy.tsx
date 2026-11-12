import { Lock, KeyRound } from "lucide-react";
import type { Privacy } from "@/lib/store";
export function PrivacyBadge({ privacy }: { privacy: Privacy }) {
  const Icon = privacy === "invite" ? Lock : KeyRound;
  return (
    <span className="inline-flex items-center gap-1.5 rounded border border-border bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
      <Icon className="h-3 w-3" aria-hidden />
      {privacy === "invite" ? "Invite only" : "Anyone with code"}
    </span>
  );
}
