import { loadConfig } from "../config.js";
import { getRecentlyPlayed } from "../steam/client.js";
import { readCache, writeCache, TTL } from "../cache/cache.js";
import type { SteamGame, FormattedRecentGame } from "../steam/types.js";

function formatRecentGame(game: SteamGame): FormattedRecentGame {
  return {
    appid: game.appid,
    name: game.name,
    playtime_2weeks_hours: Math.round(((game.playtime_2weeks ?? 0) / 60) * 10) / 10,
    playtime_forever_hours: Math.round((game.playtime_forever / 60) * 10) / 10,
  };
}

export async function getRecentlyPlayedGames(count: number = 10): Promise<FormattedRecentGame[]> {
  const { apiKey, steamId } = await loadConfig();
  const cacheKey = `recent_${steamId}`;

  let games = readCache<SteamGame[]>(cacheKey);
  if (!games) {
    games = await getRecentlyPlayed(apiKey, steamId, 100); // fetch max, slice after
    writeCache(cacheKey, games, TTL.RECENT);
  }

  return games.slice(0, Math.min(count, 100)).map(formatRecentGame);
}
