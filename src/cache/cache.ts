import fs from "fs";
import path from "path";
import os from "os";

interface CacheEntry<T> {
  data: T;
  fetchedAt: number; // unix ms
  ttlMs: number;
}

export const TTL = {
  LIBRARY: 60 * 60 * 1000,        // 1 hour
  RECENT: 30 * 60 * 1000,         // 30 minutes
  APP_DETAILS: 24 * 60 * 60 * 1000, // 24 hours
};

function getCacheDir(): string {
  return process.env.STEAM_MCP_CACHE_DIR ?? path.join(os.homedir(), ".steam-mcp", "cache");
}

function ensureCacheDir(): string {
  const dir = getCacheDir();
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function cachePath(key: string): string {
  return path.join(getCacheDir(), `${key}.json`);
}

export function readCache<T>(key: string): T | null {
  const filePath = cachePath(key);
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const entry: CacheEntry<T> = JSON.parse(raw);
    const isStale = Date.now() > entry.fetchedAt + entry.ttlMs;
    if (isStale) return null;
    return entry.data;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, data: T, ttlMs: number): void {
  const dir = ensureCacheDir();
  const entry: CacheEntry<T> = { data, fetchedAt: Date.now(), ttlMs };
  fs.writeFileSync(path.join(dir, `${key}.json`), JSON.stringify(entry, null, 2));
}

export function clearCache(): void {
  const dir = getCacheDir();
  if (!fs.existsSync(dir)) return;
  for (const file of fs.readdirSync(dir)) {
    if (file.endsWith(".json")) {
      fs.unlinkSync(path.join(dir, file));
    }
  }
}
