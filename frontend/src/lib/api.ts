export type ApiVideo = {
  id: string;
  title: string;
  description: string;
  duration: string;
  year: number | null;
  thumbnail: string | null;
  playback_url: string | null;
};
export type ApiParticipant = {
  id: number;
  name: string;
  is_host: boolean;
  joined_at: string;
};
export type ApiRoom = {
  id: string;
  name: string;
  code: string;
  host: string | null;
  privacy: "invite" | "code";
  status: "active" | "ended";
  video_id: string | null;
  source_type: "uploaded" | "local";
  participants: ApiParticipant[];
  created_at: string;
  last_active: string;
};

// Create and join return the room plus the caller's own participant token.
export type RoomSession = {
  room: ApiRoom;
  participant: ApiParticipant & { token: string };
};
const API_URL = import.meta.env["VITE_API_URL"] ?? "http://localhost:8000";

// There are no accounts. Each room you are in has its own participant token,
// kept in this browser so a page reload keeps you in the room.
const tokenKey = (roomId: string) => `streamsync.room.${roomId}`;
const roomToken = (roomId: string) =>
  typeof window === "undefined" ? null : localStorage.getItem(tokenKey(roomId));

function saveSession(session: RoomSession) {
  localStorage.setItem(tokenKey(session.room.id), session.participant.token);
  return session;
}

function errorMessage(body: unknown): string {
  // Guard: if body isn't an object (or is null), there's nothing to read.
  if (typeof body !== "object" || body === null) return "Request failed.";

  const data = body as Record<string, unknown>;
  if (typeof data["detail"] === "string") return data["detail"];
  const first = Object.values(data)[0];

  if (Array.isArray(first) && typeof first[0] === "string") return first[0];
  if (typeof first === "string") return first;

  return "Request failed.";
}

type RequestOptions = RequestInit & {
  // Room-scoped requests send that room's participant token.
  roomId?: string;
};

async function request<T>(
  path: string,
  { roomId, ...init }: RequestOptions = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  const token = roomId ? roomToken(roomId) : null;
  if (token) headers.set("X-Participant-Token", token);
  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(errorMessage(body));
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

export const api = {
  listVideos() {
    return request<ApiVideo[]>("/api/videos/");
  },
  uploadVideo(file: File, title: string, description = "", year?: number) {
    const body = new FormData();
    body.append("file", file);
    body.append("title", title);
    body.append("description", description);
    if (year) body.append("year", String(year));
    return request<ApiVideo>("/api/videos/", { method: "POST", body });
  },
  getRoom(id: string) {
    return request<ApiRoom>(`/api/rooms/${id}/`, { roomId: id });
  },
  async createRoom(input: {
    name: string;
    display_name: string;
    privacy: "invite" | "code";
    video?: string;
    source_type: "uploaded" | "local";
  }) {
    return saveSession(
      await request<RoomSession>("/api/rooms/", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    );
  },
  async joinRoom(
    join: { code: string } | { invitation: string },
    display_name: string,
  ) {
    return saveSession(
      await request<RoomSession>("/api/rooms/join/", {
        method: "POST",
        body: JSON.stringify({ ...join, display_name }),
      }),
    );
  },
};

export function roomSocket(roomId: string) {
  const base = API_URL.replace(/^http/, "ws");
  return new WebSocket(
    `${base}/ws/rooms/${roomId}/?token=${encodeURIComponent(roomToken(roomId) ?? "")}`,
  );
}
