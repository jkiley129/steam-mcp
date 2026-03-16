export interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number; // minutes
  playtime_2weeks?: number; // minutes
  rtime_last_played?: number; // unix timestamp
}

export interface SteamOwnedGamesResponse {
  response: {
    game_count: number;
    games: SteamGame[];
  };
}

export interface SteamRecentlyPlayedResponse {
  response: {
    total_count: number;
    games: SteamGame[];
  };
}

export interface SteamPlayerSummary {
  steamid: string;
  communityvisibilitystate: number; // 1=private, 3=public
  profilestate: number;
  personaname: string;
  profileurl: string;
}

export interface SteamPlayerSummariesResponse {
  response: {
    players: SteamPlayerSummary[];
  };
}

export interface SteamVanityUrlResponse {
  response: {
    steamid?: string;
    success: number; // 1=success, 42=no match
    message?: string;
  };
}

export interface SteamAppDetailsData {
  name: string;
  short_description: string;
  genres?: Array<{ id: string; description: string }>;
  categories?: Array<{ id: number; description: string }>;
  release_date?: { coming_soon: boolean; date: string };
  metacritic?: { score: number; url: string };
  is_free: boolean;
  price_overview?: {
    currency: string;
    initial: number;
    final: number;
    discount_percent: number;
    final_formatted: string;
  };
}

export interface SteamAppDetailsResponse {
  [appid: string]: {
    success: boolean;
    data?: SteamAppDetailsData;
  };
}

// Formatted output types returned by tools
export interface FormattedGame {
  appid: number;
  name: string;
  playtime_forever_hours: number;
  last_played_date: string | null;
}

export interface FormattedRecentGame {
  appid: number;
  name: string;
  playtime_2weeks_hours: number;
  playtime_forever_hours: number;
}

export interface FormattedGameDetails {
  appid: number;
  name: string;
  description: string;
  genres: string[];
  tags: string[];
  release_date: string | null;
  metacritic_score: number | null;
  is_free: boolean;
  price: string | null;
}
