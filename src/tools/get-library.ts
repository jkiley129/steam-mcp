import { loadConfig } from "../config.js";
import { getOwnedGames } from "../steam/client.js";
import { readCache, writeCache, TTL } from "../cache/cache.js";
import type { SteamGame, FormattedGame } from "../steam/types.js";

function formatGame(game: SteamGame): FormattedGame {
  return {
    appid: game.appid,
    name: game.name,
    playtime_forever_hours: Math.round((game.playtime_forever / 60) * 10) / 10,
    last_played_date:
      game.rtime_last_played && game.rtime_last_played > 0
        ? new Date(game.rtime_last_played * 1000).toISOString().split("T")[0]
        : null,
  };
}

export async function getLibrary(includeUnplayed: boolean = true): Promise<FormattedGame[]> {
  const { apiKey, steamId } = await loadConfig();
  const cacheKey = `library_${steamId}`;

  let games = readCache<SteamGame[]>(cacheKey);
  if (!games) {
    games = await getOwnedGames(apiKey, steamId);
    writeCache(cacheKey, games, TTL.LIBRARY);
  }

  const formatted = games.map(formatGame);
  if (!includeUnplayed) {
    return formatted.filter((g) => g.playtime_forever_hours > 0);
  }
  return formatted.sort((a, b) => b.playtime_forever_hours - a.playtime_forever_hours);
}
