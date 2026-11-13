/** One finished echo recording, held in memory only. durationMs is 1000 to 20000. */
export type Recording = { blob: Blob; mimeType: "audio/webm" | "audio/mp4"; durationMs: number };
