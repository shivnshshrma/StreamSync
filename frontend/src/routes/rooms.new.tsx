import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Upload,
  MonitorUp,
  AlertTriangle,
  CheckCircle2,
  HardDrive,
} from "lucide-react";
import { AppHeader } from "@/components/ss/AppHeader";
import { Poster } from "@/components/ss/Poster";
import { btnPrimary } from "@/components/ss/AuthShell";
import { cn } from "@/lib/utils";
import {
  getUser,
  saveRoom,
  newCode,
  LIBRARY,
  type Privacy,
  type User,
} from "@/lib/store";
import { sessionMedia } from "@/lib/media";

export const Route = createFileRoute("/rooms/new")({
  head: () => ({
    meta: [
      { title: "New watch room — StreamSync" },
      {
        name: "description",
        content: "Choose a video source for your new watch room.",
      },
      { property: "og:title", content: "New watch room — StreamSync" },
      {
        property: "og:description",
        content: "Choose a video source for your new watch room.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewRoom,
});

const MAX = 4 * 1024 ** 3;
type Mode = "library" | "upload" | "local";

function NewRoom() {
  const nav = useNavigate();
  const [user, setU] = useState<User | null>(null);
  const [mode, setMode] = useState<Mode>("library");
  const [name, setName] = useState("Friday Film Club");
  const [privacy, setPrivacy] = useState<Privacy>("invite");
  const [videoId, setVideoId] = useState("v1");
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const u = getUser();
    if (!u) nav({ to: "/login", replace: true });
    else setU(u);
  }, [nav]);
  if (!user) return null;

  const pick = (f?: File) => {
    setErr("");
    setProgress(null);
    if (!f) return;
    if (!f.type.startsWith("video/"))
      return setErr("That file isn't a video. Try MP4, WebM or MOV.");
    if (f.size > MAX) return setErr("Files must be 4 GB or smaller.");
    setFile(f);
    setTitle(f.name.replace(/\.[^.]+$/, ""));
  };

  const create = () => {
    if (!name.trim()) return setErr("Give the room a name.");
    if (mode !== "library" && !file)
      return setErr("Select a video file first.");
    const go = () => {
      const id = newCode();
      if (file && mode !== "library")
        sessionMedia.set(id, {
          url: URL.createObjectURL(file),
          name: title || file.name,
          mode,
        });
      saveRoom({
        id,
        name: name.trim(),
        videoId:
          mode === "library"
            ? videoId
            : LIBRARY[Math.floor(Math.random() * 4)]!.id,
        privacy,
        participants: 1,
        lastActive: new Date().toISOString(),
      });
      nav({ to: "/room/$roomId", params: { roomId: id } });
    };
    if (mode === "upload") {
      let p = 0;
      const t = setInterval(() => {
        p += 12;
        setProgress(Math.min(p, 100));
        if (p >= 100) {
          clearInterval(t);
          go();
        }
      }, 120);
    } else go();
  };

  const opt = (m: Mode, Icon: typeof Upload, t: string, d: string) => (
    <button
      type="button"
      onClick={() => {
        setMode(m);
        setFile(null);
        setErr("");
      }}
      aria-pressed={mode === m}
      className={cn(
        "rounded-lg border p-4 text-left transition-colors",
        mode === m
          ? "border-primary bg-accent"
          : "border-border bg-card hover:border-muted-foreground/40",
      )}
    >
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-3 font-medium">{t}</p>
      <p className="mt-1 text-xs text-muted-foreground">{d}</p>
    </button>
  );

  return (
    <div className="min-h-screen">
      <AppHeader user={user} />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">
          New watch room
        </h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto]">
          <label className="text-sm">
            <span className="font-medium">Room name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-md border border-input bg-card px-3 outline-none focus-visible:border-ring"
            />
          </label>
          <fieldset className="text-sm">
            <legend className="font-medium">Who can join</legend>
            <div className="mt-1.5 flex h-10 rounded-md border border-input p-1">
              {(["invite", "code"] as Privacy[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={privacy === p}
                  onClick={() => setPrivacy(p)}
                  className={cn(
                    "rounded px-3 text-xs",
                    privacy === p
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {p === "invite" ? "Invite only" : "Anyone with code"}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <h2 className="mt-8 text-sm font-medium">Video source</h2>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          {opt(
            "library",
            HardDrive,
            "From your library",
            "Videos you've already uploaded.",
          )}
          {opt(
            "upload",
            Upload,
            "Upload a video",
            "Stored in your private library for future rooms.",
          )}
          {opt(
            "local",
            MonitorUp,
            "Stream from this device",
            "Plays from your computer. Nothing is uploaded.",
          )}
        </div>

        <div className="mt-6 rounded-lg border border-border bg-card p-5">
          {mode === "library" && (
            <div className="grid grid-cols-4 gap-3">
              {LIBRARY.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVideoId(v.id)}
                  aria-pressed={videoId === v.id}
                  className={cn(
                    "rounded-md p-1 text-left",
                    videoId === v.id && "ring-2 ring-primary",
                  )}
                >
                  <Poster video={v} className="aspect-[2/3]" />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {v.duration}
                  </p>
                </button>
              ))}
            </div>
          )}
          {mode !== "library" && (
            <>
              <input
                ref={input}
                type="file"
                accept="video/*"
                className="sr-only"
                onChange={(e) => pick(e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => input.current?.click()}
                className="w-full rounded-md border border-dashed border-border px-4 py-8 text-center text-sm hover:border-primary"
              >
                {file ? (
                  <span className="font-medium">
                    {file.name}{" "}
                    <span className="text-muted-foreground">
                      · {(file.size / 1024 ** 2).toFixed(0)} MB
                    </span>
                  </span>
                ) : (
                  <span className="font-medium">Select a video file</span>
                )}
                <span className="mt-1 block text-xs text-muted-foreground">
                  MP4, WebM or MOV · up to 4 GB
                </span>
              </button>
              {mode === "upload" && file && (
                <div className="mt-4 grid gap-3">
                  <label className="text-sm">
                    <span className="font-medium">Title</span>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 outline-none focus-visible:border-ring"
                    />
                  </label>
                  <label className="text-sm">
                    <span className="font-medium">Description</span>
                    <textarea
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      rows={2}
                      className="mt-1.5 w-full rounded-md border border-input bg-background p-3 outline-none focus-visible:border-ring"
                    />
                  </label>
                  {progress !== null && (
                    <div aria-live="polite">
                      <div className="h-1.5 rounded bg-secondary">
                        <div
                          className="h-1.5 rounded bg-primary transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Uploading… {progress}%
                      </p>
                    </div>
                  )}
                </div>
              )}
              {mode === "local" && (
                <div className="mt-4 space-y-2 text-sm">
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <HardDrive className="h-4 w-4" />
                    The file stays on your device. Guests receive a live stream
                    only.
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle2
                      className={cn(
                        "h-4 w-4",
                        file ? "text-success" : "text-muted-foreground",
                      )}
                    />
                    {file
                      ? "File access granted · ready to stream"
                      : "Waiting for file access"}
                  </p>
                  <p className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-warning">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    The stream ends for everyone if you close this tab or
                    disconnect.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
        {err && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {err}
          </p>
        )}
        <div className="mt-6 flex justify-end">
          <button
            onClick={create}
            disabled={progress !== null}
            className={btnPrimary}
          >
            {mode === "upload" ? "Upload and open room" : "Open room"}
          </button>
        </div>
      </main>
    </div>
  );
}
