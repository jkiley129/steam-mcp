import { clearCache } from "../cache/cache.js";

export function refreshLibrary(): { message: string } {
  clearCache();
  return { message: "Cache cleared. Next query will fetch live data from Steam." };
}
