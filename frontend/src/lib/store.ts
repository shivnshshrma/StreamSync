// Local demo store (browser only). Replace with Lovable Cloud for real accounts/sync.
export type Privacy = "invite" | "code";
export type Video = {
  id: string;
  title: string;
  description: string;
  duration: string;
  hue: number;
  year: number;
  src?: string;
};
export type Room = {
  id: string;
  name: string;
  videoId: string;
  privacy: Privacy;
  participants: number;
  lastActive: string;
};
export type User = { name: string; email: string };

export const LIBRARY: Video[] = [
  {
    id: "v1",
    title: "After the Last Signal",
    description:
      "A radio operator on a decommissioned island station keeps receiving a broadcast that shouldn't exist.",
    duration: "1h 52m",
    hue: 40,
    year: 2024,
  },
  {
    id: "v2",
    title: "The Quiet Meridian",
    description:
      "Two cartographers retrace a forgotten line of longitude across a winter that refuses to end.",
    duration: "2h 06m",
    hue: 70,
    year: 2023,
  },
  {
    id: "v3",
    title: "Orbiting June",
    description:
      "A summer of near-misses between a planetarium guide and the astronomer who keeps correcting her.",
    duration: "1h 38m",
    hue: 55,
    year: 2025,
  },
  {
    id: "v4",
    title: "A Map of Small Fires",
    description:
      "Four siblings return to their late mother's farmhouse and find her notebooks of unfinished arguments.",
    duration: "1h 47m",
    hue: 25,
    year: 2022,
  },
];

const get = <T>(k: string, d: T): T => {
  if (typeof window === "undefined") return d;
  try {
    return JSON.parse(localStorage.getItem(k) ?? "") as T;
  } catch {
    return d;
  }
};
const set = (k: string, v: unknown) =>
  localStorage.setItem(k, JSON.stringify(v));

export const getUser = () => get<User | null>("ss.user", null);
export const setUser = (u: User | null) =>
  u ? set("ss.user", u) : localStorage.removeItem("ss.user");
export const getRooms = () => get<Room[]>("ss.rooms", []);
export const getRoom = (id: string) => getRooms().find((r) => r.id === id);
export const saveRoom = (r: Room) =>
  set("ss.rooms", [r, ...getRooms().filter((x) => x.id !== r.id)]);
export const deleteRoom = (id: string) =>
  set(
    "ss.rooms",
    getRooms().filter((r) => r.id !== id),
  );
export const getSavedIds = () => get<string[]>("ss.saved", ["v1", "v3"]);
export const getVideo = (id: string) =>
  LIBRARY.find((v) => v.id === id) ?? LIBRARY[0]!;
export const newCode = () =>
  Array.from(
    { length: 6 },
    () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)],
  ).join("");

export function timeAgo(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
}
