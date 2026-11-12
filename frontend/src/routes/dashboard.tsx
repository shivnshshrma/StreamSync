import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Users, Film } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/ss/AppHeader";
import { Poster } from "@/components/ss/Poster";
import { PrivacyBadge } from "@/components/ss/Privacy";
import { btnPrimary, btnGhost } from "@/components/ss/AuthShell";
import {
  getUser,
  getRooms,
  getRoom,
  getSavedIds,
  getVideo,
  timeAgo,
  type Room,
  type User,
} from "@/lib/store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Your rooms — StreamSync" },
      { name: "description", content: "Your watch rooms and saved videos." },
      { property: "og:title", content: "Your rooms — StreamSync" },
      {
        property: "og:description",
        content: "Your watch rooms and saved videos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const nav = useNavigate();
  const [user, setU] = useState<User | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [code, setCode] = useState("");
  useEffect(() => {
    const u = getUser();
    if (!u) {
      void nav({ to: "/login", replace: true });
      return undefined;
    }
    setU(u);
    setRooms(getRooms());
    setSaved(getSavedIds());
    return undefined;
  }, [nav]);
  if (!user) return null;
  const join = (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (c.length !== 6) {
      toast.error("Room codes are 6 characters, like K7QX2M.");
      return;
    }
    if (!getRoom(c)) {
      toast.error(`No room found for ${c}. Check the code with your host.`);
      return;
    }
    void nav({ to: "/room/$roomId", params: { roomId: c } });
  };
  return (
    <div className="min-h-screen">
      <AppHeader user={user} />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Good to see you, {user.name.split(" ")[0]}.
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick up where you left off, or open a new room.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <form onSubmit={join} className="flex gap-2">
              <label htmlFor="code" className="sr-only">
                Room code
              </label>
              <input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Room code"
                maxLength={6}
                className="h-10 w-32 rounded-md border border-input bg-card px-3 font-mono text-sm uppercase outline-none focus-visible:border-ring"
              />
              <button className={btnGhost}>Join a room</button>
            </form>
            <Link to="/rooms/new" className={btnPrimary}>
              <Plus className="h-4 w-4" />
              Create room
            </Link>
          </div>
        </div>

        <section className="mt-10">
          <h2 className="text-sm font-medium text-muted-foreground">
            Recent rooms
          </h2>
          {rooms.length === 0 ? (
            <div className="mt-3 rounded-lg border border-dashed border-border p-8 text-sm">
              <p className="font-medium">No rooms yet</p>
              <p className="mt-1 text-muted-foreground">
                Create a room, pick a video, then share the 6-character code
                with whoever you're watching with.
              </p>
              <Link to="/rooms/new" className={btnPrimary + " mt-4"}>
                Create your first room
              </Link>
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-border rounded-lg border border-border bg-card">
              {rooms.map((r) => {
                const v = getVideo(r.videoId);
                return (
                  <li key={r.id} className="flex items-center gap-4 p-3">
                    <Poster
                      video={v}
                      className="h-12 w-20 shrink-0"
                      showTitle={false}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{r.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {v.title} · active {timeAgo(r.lastActive)}
                      </p>
                    </div>
                    <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
                      <Users className="h-3.5 w-3.5" />
                      {r.participants}
                    </span>
                    <span className="hidden md:block">
                      <PrivacyBadge privacy={r.privacy} />
                    </span>
                    <Link
                      to="/room/$roomId"
                      params={{ roomId: r.id }}
                      className={btnGhost + " h-8"}
                    >
                      Continue
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-sm font-medium text-muted-foreground">
            Saved videos
          </h2>
          {saved.length === 0 ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Film className="h-4 w-4" />
              Videos you upload will appear here.
            </p>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {saved.map((id) => {
                const v = getVideo(id);
                return (
                  <div key={id}>
                    <Poster video={v} className="aspect-[2/3]" />
                    <p className="mt-2 text-xs text-muted-foreground">
                      {v.year} · {v.duration}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
