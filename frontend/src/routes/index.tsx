import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Lock,
  RefreshCw,
  HardDrive,
  Play,
  Pause,
  Users,
  Upload,
  MonitorUp,
  MessageSquare,
} from "lucide-react";
import { Logo } from "@/components/ss/Logo";
import { ThemeToggle } from "@/components/ss/ThemeToggle";
import { Poster } from "@/components/ss/Poster";
import { btnPrimary } from "@/components/ss/AuthShell";
import { LIBRARY } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StreamSync — Watch together, wherever you are" },
      {
        name: "description",
        content:
          "Private watch rooms with synchronized playback, chat, and your own videos.",
      },
      {
        property: "og:title",
        content: "StreamSync — Watch together, wherever you are",
      },
      {
        property: "og:description",
        content:
          "Private watch rooms with synchronized playback, chat, and your own videos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Logo />
        <nav className="hidden gap-6 text-sm text-muted-foreground md:flex">
          <a href="#how" className="hover:text-foreground">
            How it works
          </a>
          <a href="#features" className="hover:text-foreground">
            Features
          </a>
          <a href="#sources" className="hover:text-foreground">
            Sources
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            to="/login"
            className="px-3 text-sm text-muted-foreground hover:text-foreground"
          >
            Log in
          </Link>
          <Link to="/signup" className={btnPrimary + " h-9 rounded-full"}>
            Create an account
          </Link>
        </div>
      </header>

      <section className="relative mx-auto max-w-5xl px-6 pb-28 pt-24 text-center">
        <h1 className="relative text-6xl font-bold leading-[0.95] tracking-tighter sm:text-8xl lg:text-[8.5rem]">
          Watch it{" "}
          <span className="font-display font-normal italic text-primary">
            together
          </span>
          <br />
          <span className="font-display font-normal italic">from</span>{" "}
          anywhere.
        </h1>
        <p className="mx-auto mt-8 max-w-md text-muted-foreground">
          Open a private room, share a code, press play. Everyone sees the same
          frame at the same moment — uploaded or streamed from your laptop.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/signup" className={btnPrimary + " h-11 rounded-full px-6"}>
            <Play className="h-4 w-4" />
            Create a watch room
          </Link>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            then share{" "}
            <kbd className="rounded border border-border bg-card px-1.5 py-0.5 font-mono text-foreground">
              K7QX2M
            </kbd>
          </span>
        </div>
      </section>

      <section
        id="how"
        className="bg-band text-band-foreground [clip-path:polygon(0_6%,100%_0,100%_100%,0_100%)]"
      >
        <div className="mx-auto max-w-6xl px-6 pb-20 pt-28">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="text-5xl font-bold leading-[0.95] tracking-tighter sm:text-7xl">
              Create.
              <br />
              Share.{" "}
              <span className="font-display font-normal italic">Play.</span>
            </h2>
            <ol className="flex flex-wrap gap-2">
              {["Create a room", "Share the code", "Press play"].map((t, i) => (
                <li
                  key={t}
                  className={
                    "flex items-center gap-2 rounded-full bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-soft " +
                    (i % 2 ? "rotate-1" : "-rotate-1")
                  }
                >
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-foreground text-[10px] text-background">
                    {i + 1}
                  </span>
                  {t}
                </li>
              ))}
            </ol>
          </div>
          <div className="mt-12 text-foreground">
            <Preview />
          </div>
        </div>
      </section>

      <section
        id="sources"
        className="mx-auto grid max-w-6xl gap-12 px-6 py-24 lg:grid-cols-2 lg:items-center"
      >
        <div>
          <h2 className="text-5xl font-bold leading-[0.95] tracking-tighter sm:text-6xl">
            Your{" "}
            <span className="font-display font-normal italic text-primary">
              files.
            </span>
            <br />
            Your{" "}
            <span className="font-display font-normal italic text-primary">
              control.
            </span>
          </h2>
          <p className="mt-6 max-w-md text-muted-foreground">
            Upload a video to your library, or stream a file straight from your
            device. Streamed files never leave your machine, and the stream ends
            when you leave.
          </p>
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" />
              Upload
            </li>
            <li className="flex items-center gap-2">
              <MonitorUp className="h-4 w-4 text-primary" />
              Stream from device
            </li>
            <li className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              Private rooms
            </li>
          </ul>
        </div>
        <div className="relative h-80">
          {LIBRARY.slice(0, 3).map((v, i) => (
            <Poster
              key={v.id}
              video={v}
              className={
                "absolute aspect-[2/3] w-40 shadow-soft " +
                [
                  "left-[8%] top-10 -rotate-6",
                  "left-[36%] top-0 rotate-2",
                  "left-[62%] top-12 rotate-6",
                ][i]
              }
            />
          ))}
        </div>
      </section>

      <section id="features" className="border-t border-border">
        <div className="mx-auto grid max-w-6xl gap-x-10 gap-y-8 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [
              RefreshCw,
              "Frame-accurate sync",
              "Play, pause, seek and timestamp are shared across the room.",
            ],
            [
              Users,
              "Host controls",
              "Decide who can control playback, remove guests, or end the room.",
            ],
            [
              HardDrive,
              "Stream from device",
              "Your file never leaves your machine. The stream ends when you leave.",
            ],
            [
              MessageSquare,
              "Chat beside the player",
              "Talk through the slow parts without covering the picture.",
            ],
          ].map(([I, t, d]) => {
            const Icon = I as typeof Lock;
            return (
              <div key={t as string}>
                <Icon className="h-5 w-5 text-primary" />
                <h3 className="mt-3 font-medium">{t as string}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {d as string}
                </p>
              </div>
            );
          })}
        </div>
      </section>
      <footer className="border-t border-border px-6 py-8 text-center text-xs text-muted-foreground">
        StreamSync · Built for small rooms and long films.
      </footer>
    </div>
  );
}

function Preview() {
  const v = LIBRARY[0]!;
  return (
    <div
      className="overflow-hidden rounded-lg border border-border bg-card shadow-soft"
      aria-label="Product preview"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Friday Film Club</span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Everyone is synced
        </span>
      </div>
      <div className="grid grid-cols-[1fr_180px]">
        <div className="p-3">
          <Poster video={v} className="aspect-video" showTitle={false} />
          <div className="mt-3 flex items-center gap-3">
            <Pause className="h-4 w-4" />
            <div className="h-1 flex-1 rounded bg-secondary">
              <div className="h-1 w-[38%] rounded bg-primary" />
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              42:17 / 1:52:00
            </span>
          </div>
          <p className="mt-2 text-sm font-medium">{v.title}</p>
        </div>
        <div className="space-y-3 border-l border-border p-3 text-xs">
          <p className="font-medium text-muted-foreground">Watching · 4</p>
          {["Maya (host)", "Jonah", "Priya", "Alex"].map((n, i) => (
            <p key={n} className="flex items-center gap-2">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-accent text-[10px]">
                {n[0]}
              </span>
              {n}
              {i === 3 && <span className="ml-auto text-warning">…</span>}
            </p>
          ))}
          <div className="space-y-1.5 border-t border-border pt-3">
            <p>
              <b>Jonah</b> the static at 41:50 😶
            </p>
            <p>
              <b>Priya</b> rewind 10s?
            </p>
            <p>
              <b>Maya</b> done
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
