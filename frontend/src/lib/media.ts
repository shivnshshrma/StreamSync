// Object URLs for files picked this session (uploads are simulated; local streams never leave the device).
export const sessionMedia = new Map<
  string,
  { url: string; name: string; mode: "upload" | "local" }
>();
