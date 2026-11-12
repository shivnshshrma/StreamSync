export type ApiUser = { id: number; name: string; email: string };
export type ApiVideo = {
  id: string;
  title: string;
  description: string;
  duration: string;
  year: number | null;
  thumbnail: string | null;
  playback_url: string | null;
};
export type ApiRoom = {
  id: string;
  name: string;
  code: string;
  host: string;
  privacy: "invite" | "code";
  status: "active" | "ended";
  video_id: string | null;
  source_type: "uploaded" | "local";
  participants: Array<{ user: number; name: string; email: string; is_host: boolean }>;
  created_at: string;
  last_active: string;
};

type AuthResponse = { user: ApiUser; access: string; refresh: string };
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const ACCESS_KEY = "streamsync.access";
const REFRESH_KEY = "streamsync.refresh";

const accessToken = () =>
  typeof window === "undefined" ? null : localStorage.getItem(ACCESS_KEY);

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  const token = accessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail ?? "Request failed.");
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

function saveAuth(auth: AuthResponse) {
  localStorage.setItem(ACCESS_KEY, auth.access);
  localStorage.setItem(REFRESH_KEY, auth.refresh);
  return auth.user;
}

export const api = {
  async signup(name: string, email: string, password: string) {
    return saveAuth(await request<AuthResponse>("/api/auth/signup/", {
      method: "POST", body: JSON.stringify({ name, email, password }),
    }));
  },
  async login(email: string, password: string) {
    return saveAuth(await request<AuthResponse>("/api/auth/login/", {
      method: "POST", body: JSON.stringify({ email, password }),
    }));
  },
  async me() { return request<ApiUser>("/api/auth/me/"); },
  async logout() {
    await request<void>("/api/auth/logout/", {
      method: "POST",
      body: JSON.stringify({ refresh: localStorage.getItem(REFRESH_KEY) }),
    });
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
  listVideos() { return request<ApiVideo[]>("/api/videos/"); },
  uploadVideo(file: File, title: string, description = "", year?: number) {
    const body = new FormData();
    body.append("file", file);
    body.append("title", title);
    body.append("description", description);
    if (year) body.append("year", String(year));
    return request<ApiVideo>("/api/videos/", { method: "POST", body });
  },
  listRooms() { return request<ApiRoom[]>("/api/rooms/"); },
  getRoom(id: string) { return request<ApiRoom>(`/api/rooms/${id}/`); },
  createRoom(input: { name: string; privacy: "invite" | "code"; video?: string; source_type: "uploaded" | "local" }) {
    return request<ApiRoom>("/api/rooms/", { method: "POST", body: JSON.stringify(input) });
  },
  joinRoom(code: string) {
    return request<ApiRoom>("/api/rooms/join/", { method: "POST", body: JSON.stringify({ code }) });
  },
};

export function roomSocket(roomId: string) {
  const token = accessToken();
  const base = API_URL.replace(/^http/, "ws");
  return new WebSocket(`${base}/ws/rooms/${roomId}/?token=${encodeURIComponent(token ?? "")}`);
}
