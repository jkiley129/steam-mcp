import { loadConfig } from "../config.js";
import { getOwnedGames, getAppDetails } from "../steam/client.js";
import { readCache, writeCache, TTL } from "../cache/cache.js";
import type { SteamGame, FormattedGameDetails } from "../steam/types.js";

async function resolveAppId(name: string, apiKey: string, steamId: string): Promise<number> {
  const cacheKey = `library_${steamId}`;
  let games = readCache<SteamGame[]>(cacheKey);
  if (!games) {
    games = await getOwnedGames(apiKey, steamId);
    writeCache(cacheKey, games, TTL.LIBRARY);
  }

  const q = name.toLowerCase();
  const matches = games.filter((g) => g.name.toLowerCase().includes(q));

  if (matches.length === 0) {
    throw new Error(
      `No game matching "${name}" found in your library. Try a different name or use the appid directly.`
    );
  }

  // Prefer shortest matching name (closest match)
  matches.sort((a, b) => a.name.length - b.name.length);
  return matches[0].appid;
}

export async function getGameDetails(params: {
  appid?: number;
  name?: string;
}): Promise<FormattedGameDetails> {
  if (!params.appid && !params.name) {
    throw new Error("Provide either appid or name.");
  }

  const { apiKey, steamId } = await loadConfig();

  const appid = params.appid ?? (await resolveAppId(params.name!, apiKey, steamId));
  const cacheKey = `appdetails_${appid}`;

  let details = readCache<FormattedGameDetails>(cacheKey);
  if (details) return details;

  const raw = await getAppDetails(appid);
  if (!raw) {
    throw new Error(
      `Could not fetch details for appid ${appid}. The game may not be on the Steam Store, or the Store API is temporarily unavailable.`
    );
  }

  const formatted: FormattedGameDetails = {
    appid,
    name: raw.name,
    description: raw.short_description,
    genres: raw.genres?.map((g) => g.description) ?? [],
    tags: raw.categories?.map((c) => c.description) ?? [],
    release_date: raw.release_date?.date ?? null,
    metacritic_score: raw.metacritic?.score ?? null,
    is_free: raw.is_free,
    price: raw.price_overview?.final_formatted ?? (raw.is_free ? "Free" : null),
  };

  writeCache(cacheKey, formatted, TTL.APP_DETAILS);
  return formatted;
}
