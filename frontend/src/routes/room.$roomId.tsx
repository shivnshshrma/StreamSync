import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Copy,
  ArrowLeft,
  Crown,
  UserMinus,
  Power,
  Film,
  Send,
  RotateCcw,
  RotateCw,
} from "lucide-react";
import { toast } from "sonner";
import { Poster } from "@/components/ss/Poster";
import { PrivacyBadge } from "@/components/ss/Privacy";
import { btnGhost, btnPrimary } from "@/components/ss/AuthShell";
import { cn } from "@/lib/utils";
import {
  getRoom,
  getUser,
  getVideo,
  saveRoom,
  deleteRoom,
  type Room,
  type User,
} from "@/lib/store";
import { sessionMedia } from "@/lib/media";

export const Route = createFileRoute("/room/$roomId")({
  head: ({ params }) => ({
    meta: [
      { title: `Room ${params.roomId} — StreamSync` },
      { name: "description", content: "A private StreamSync watch room." },
      { property: "og:title", content: "You're invited to a StreamSync room" },
      {
        property: "og:description",
        content: "Join a private, synchronized watch room.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WatchRoom,
});

type Sync = { playing: boolean; time: number; at: number };
type Msg = { id: string; who: string; text: string };
type Member = {
  name: string;
  host?: boolean;
  status: "synced" | "reconnecting";
};
const DUR = 112 * 60;
const fmt = (s: number) => {
  s = Math.max(0, Math.floor(s));
  const h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60),
    ss = s % 60;
  return (
    (h ? `${h}:${String(m).padStart(2, "0")}` : `${m}`) +
    `:${String(ss).padStart(2, "0")}`
  );
};
const now = (s: Sync) =>
  s.playing ? s.time + (Date.now() - s.at) / 1000 : s.time;

function WatchRoom() {
  const { roomId } = Route.useParams();
  const nav = useNavigate();
  const [room, setRoom] = useState<Room | null | undefined>(undefined);
  const [user, setU] = useState<User | null>(null);
  const [sync, setSync] = useState<Sync>({
    playing: false,
    time: 0,
    at: Date.now(),
  });
  const [, tick] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [vol, setVol] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [guestsControl, setGuestsControl] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [msgs, setMsgs] = useState<Msg[]>([
    { id: "1", who: "Jonah", text: "popcorn acquired" },
    { id: "2", who: "Priya", text: "start whenever" },
  ]);
  const [draft, setDraft] = useState("");
  const [tab, setTab] = useState<"chat" | "people">("chat");
  const ch = useRef<BroadcastChannel | null>(null);
  const vid = useRef<HTMLVideoElement>(null);
  const media = sessionMedia.get(roomId);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      nav({ to: "/login", replace: true });
      return;
    }
    setU(u);
    const r = getRoom(roomId) ?? null;
    setRoom(r);
    if (!r) return undefined;
    saveRoom({ ...r, lastActive: new Date().toISOString(), participants: 4 });
    setMembers([
      { name: u.name, host: true, status: "synced" },
      { name: "Jonah", status: "synced" },
      { name: "Priya", status: "synced" },
      { name: "Alex", status: "reconnecting" },
    ]);
    const t = setTimeout(
      () => setMembers((m) => m.map((x) => ({ ...x, status: "synced" }))),
      4000,
    );
    const c = new BroadcastChannel(`ss-${roomId}`);
    ch.current = c;
    c.onmessage = (e) => {
      if (e.data.type === "sync") applyRemote(e.data.sync);
      if (e.data.type === "chat") setMsgs((m) => [...m, e.data.msg]);
    };
    const i = setInterval(() => tick((n) => n + 1), 500);
    return () => {
      c.close();
      clearInterval(i);
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, nav]);

  const applyRemote = (s: Sync) => {
    setSyncing(true);
    setSync(s);
    setTimeout(() => setSyncing(false), 600);
  };
  const push = (s: Sync) => {
    setSync(s);
    ch.current?.postMessage({ type: "sync", sync: s });
    setSyncing(true);
    setTimeout(() => setSyncing(false), 400);
  };

  useEffect(() => {
    const v = vid.current;
    if (!v) return;
    const t = now(sync);
    if (Math.abs(v.currentTime - t) > 0.6) v.currentTime = t;
    if (sync.playing && v.paused) v.play().catch(() => {});
    if (!sync.playing && !v.paused) v.pause();
  }, [sync]);
  useEffect(() => {
    if (vid.current) {
      vid.current.volume = vol;
      vid.current.muted = muted;
    }
  }, [vol, muted]);

  if (room === undefined || !user)
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Joining room…
      </div>
    );
  if (room === null)
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center">
        <div>
          <h1 className="text-xl font-semibold">This room isn't available</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The code <span className="font-mono">{roomId}</span> doesn't match
            an open room, or the host ended it.
          </p>
          <Link to="/dashboard" className={btnPrimary + " mt-6"}>
            Back to your rooms
          </Link>
        </div>
      </div>
    );

  const video = getVideo(room.videoId);
  const duration =
    vid.current?.duration && isFinite(vid.current.duration)
      ? vid.current.duration
      : DUR;
  const t = Math.min(now(sync), duration);
  const toggle = () =>
    push({ playing: !sync.playing, time: t, at: Date.now() });
  const seek = (s: number) =>
    push({
      playing: sync.playing,
      time: Math.max(0, Math.min(duration, s)),
      at: Date.now(),
    });
  const reconnecting = members.filter((m) => m.status === "reconnecting");
  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    const msg = { id: crypto.randomUUID(), who: user.name, text: draft.trim() };
    setMsgs((m) => [...m, msg]);
    ch.current?.postMessage({ type: "chat", msg });
    setDraft("");
  };
  const copy = () => {
    navigator.clipboard?.writeText(`${location.origin}/room/${room.id}`);
    toast.success("Invite link copied", {
      description: `Room code ${room.id}`,
    });
  };

  return (
    <div className="flex min-h-screen flex-col lg:h-screen lg:flex-row">
      <main className="flex min-w-0 flex-1 flex-col p-4 lg:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/dashboard"
            aria-label="Back to dashboard"
            className="rounded p-1 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-semibold">{room.name}</h1>
          <PrivacyBadge privacy={room.privacy} />
          <span className="text-xs text-muted-foreground">
            {members.length} watching · only invited people can join
          </span>
          <button
            onClick={copy}
            className={btnGhost + " ml-auto h-8 font-mono text-xs"}
          >
            <Copy className="h-3.5 w-3.5" />
            {room.id}
          </button>
        </div>

        <div className="relative mt-4 flex flex-1 items-center justify-center overflow-hidden rounded-lg bg-background shadow-soft ring-1 ring-border">
          {media ? (
            <video
              ref={vid}
              src={media.url}
              className="h-full max-h-[70vh] w-full object-contain lg:max-h-none"
              onClick={toggle}
              playsInline
            />
          ) : (
            <button
              onClick={toggle}
              className="relative aspect-video w-full max-w-full"
              aria-label={sync.playing ? "Pause" : "Play"}
            >
              <Poster
                video={video}
                className="absolute inset-0 rounded-none"
                showTitle={false}
              />
              {!sync.playing && (
                <span className="absolute inset-0 grid place-items-center">
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-background/70 backdrop-blur">
                    <Play className="h-7 w-7 translate-x-0.5" />
                  </span>
                </span>
              )}
            </button>
          )}
          <div
            aria-live="polite"
            className={cn(
              "absolute left-3 top-3 flex items-center gap-2 rounded-md bg-background/80 px-2.5 py-1 text-xs backdrop-blur transition-opacity",
              syncing || reconnecting.length ? "opacity-100" : "opacity-70",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                syncing
                  ? "animate-pulse bg-primary"
                  : reconnecting.length
                    ? "bg-warning"
                    : "bg-success",
              )}
            />
            {syncing
              ? "Syncing playback…"
              : reconnecting.length
                ? `${reconnecting[0]?.name} is reconnecting`
                : "Everyone is synced"}
          </div>
          {media?.mode === "local" && (
            <span className="absolute right-3 top-3 rounded-md bg-background/80 px-2.5 py-1 text-xs text-warning backdrop-blur">
              Streaming from your device
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={() => seek(t - 10)}
            aria-label="Back 10 seconds"
            className="rounded p-1.5 hover:bg-secondary"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={toggle}
            aria-label={sync.playing ? "Pause" : "Play"}
            className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground hover:bg-primary-hover"
          >
            {sync.playing ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 translate-x-px" />
            )}
          </button>
          <button
            onClick={() => seek(t + 10)}
            aria-label="Forward 10 seconds"
            className="rounded p-1.5 hover:bg-secondary"
          >
            <RotateCw className="h-4 w-4" />
          </button>
          <span className="w-16 text-right font-mono text-xs text-muted-foreground">
            {fmt(t)}
          </span>
          <input
            type="range"
            min={0}
            max={duration}
            step={1}
            value={t}
            onChange={(e) => seek(+e.target.value)}
            aria-label="Seek"
            className="flex-1 accent-primary"
          />
          <span className="w-16 font-mono text-xs text-muted-foreground">
            {fmt(duration)}
          </span>
          <button
            onClick={() => setMuted(!muted)}
            aria-label={muted ? "Unmute" : "Mute"}
            className="rounded p-1.5 hover:bg-secondary"
          >
            {muted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={vol}
            onChange={(e) => setVol(+e.target.value)}
            aria-label="Volume"
            className="hidden w-20 accent-primary sm:block"
          />
          <button
            onClick={() => vid.current?.requestFullscreen?.()}
            aria-label="Fullscreen"
            className="rounded p-1.5 hover:bg-secondary"
          >
            <Maximize className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 flex gap-4">
          <Poster
            video={video}
            className="hidden h-24 w-16 shrink-0 sm:block"
            showTitle={false}
          />
          <div>
            <p className="font-medium">{media?.name ?? video.title}</p>
            <p className="text-xs text-muted-foreground">
              {video.year} · {video.duration}
            </p>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {video.description}
            </p>
          </div>
        </div>
      </main>

      <aside className="flex w-full flex-col border-t border-border bg-card lg:w-80 lg:border-l lg:border-t-0">
        <div role="tablist" className="flex border-b border-border text-sm">
          {(["chat", "people"] as const).map((k) => (
            <button
              key={k}
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={cn(
                "flex-1 py-3 capitalize",
                tab === k
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {k === "people" ? `People · ${members.length}` : "Chat"}
            </button>
          ))}
        </div>
        {tab === "chat" ? (
          <>
            <ul
              className="flex-1 space-y-3 overflow-y-auto p-4 text-sm"
              aria-live="polite"
            >
              {msgs.map((m) => (
                <li key={m.id}>
                  <span className="font-medium">{m.who}</span>{" "}
                  <span className="text-muted-foreground">{m.text}</span>
                </li>
              ))}
            </ul>
            <form
              onSubmit={send}
              className="flex gap-2 border-t border-border p-3"
            >
              <label htmlFor="chat" className="sr-only">
                Message
              </label>
              <input
                id="chat"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Say something…"
                className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring"
              />
              <button
                aria-label="Send"
                className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 text-sm">
            <ul className="space-y-2">
              {members.map((m) => (
                <li key={m.name} className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-xs">
                    {m.name[0]}
                  </span>
                  <span>{m.name}</span>
                  {m.host && (
                    <Crown
                      className="h-3.5 w-3.5 text-warning"
                      aria-label="Host"
                    />
                  )}
                  <span
                    className={cn(
                      "ml-auto text-xs",
                      m.status === "synced" ? "text-success" : "text-warning",
                    )}
                  >
                    {m.status === "synced" ? "Synced" : "Reconnecting"}
                  </span>
                  {!m.host && (
                    <button
                      onClick={() => {
                        setMembers((x) => x.filter((y) => y.name !== m.name));
                        toast(`${m.name} was removed from the room`);
                      }}
                      aria-label={`Remove ${m.name}`}
                      className="rounded p-1 text-muted-foreground hover:text-destructive"
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <h3 className="mt-6 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Host controls
            </h3>
            <label className="mt-3 flex items-center justify-between">
              <span>Guests can play & pause</span>
              <input
                type="checkbox"
                checked={guestsControl}
                onChange={(e) => setGuestsControl(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
            </label>
            <Link to="/rooms/new" className={btnGhost + " mt-4 w-full"}>
              <Film className="h-4 w-4" />
              Change video source
            </Link>
            <button
              onClick={() => {
                if (confirm("End this room for everyone?")) {
                  deleteRoom(room.id);
                  toast("Room ended");
                  nav({ to: "/dashboard" });
                }
              }}
              className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-destructive/50 text-sm text-destructive hover:bg-destructive/10"
            >
              <Power className="h-4 w-4" />
              End room
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
