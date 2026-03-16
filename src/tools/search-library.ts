import { getLibrary } from "./get-library.js";
import type { FormattedGame } from "../steam/types.js";

export interface SearchParams {
  query?: string;
  min_hours?: number;
  max_hours?: number;
  unplayed_only?: boolean;
  limit?: number;
}

export async function searchLibrary(params: SearchParams): Promise<FormattedGame[]> {
  const { query, min_hours, max_hours, unplayed_only, limit = 20 } = params;

  let games = await getLibrary(true); // uses cache internally

  if (query) {
    const q = query.toLowerCase();
    games = games.filter((g) => g.name.toLowerCase().includes(q));
  }

  if (min_hours !== undefined) {
    games = games.filter((g) => g.playtime_forever_hours >= min_hours);
  }

  if (max_hours !== undefined) {
    games = games.filter((g) => g.playtime_forever_hours <= max_hours);
  }

  if (unplayed_only) {
    games = games.filter((g) => g.playtime_forever_hours === 0);
  }

  return games.slice(0, limit);
}
