import fetch from "node-fetch";
import type {
  SteamOwnedGamesResponse,
  SteamRecentlyPlayedResponse,
  SteamPlayerSummariesResponse,
  SteamVanityUrlResponse,
  SteamAppDetailsResponse,
  SteamGame,
  SteamPlayerSummary,
  SteamAppDetailsData,
} from "./types.js";

const STEAM_API_BASE = "https://api.steampowered.com";
const STORE_API_BASE = "https://store.steampowered.com/api";

async function steamGet<T>(url: string): Promise<T> {
  let res: Awaited<ReturnType<typeof fetch>>;
  try {
    res = await fetch(url);
  } catch (err) {
    throw new Error(
      `Could not reach Steam. Check your internet connection.\nDetail: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (!res.ok) {
    switch (res.status) {
      case 401:
        throw new Error(
          "Steam API key is invalid or expired. Check your key at: https://steamcommunity.com/dev/apikey"
        );
      case 403:
        throw new Error(
          "Steam denied access (403). Your profile or game library may be private. " +
          "Set both to Public in Steam → your profile → Edit Profile → Privacy Settings."
        );
      case 429:
        throw new Error(
          "Steam is rate-limiting requests (429). Wait a minute and try again."
        );
      default:
        if (res.status >= 500) {
          throw new Error(
            `Steam servers returned an error (${res.status}). This is on Steam's side — try again in a moment.`
          );
        }
        throw new Error(`Steam API error: ${res.status} ${res.statusText}`);
    }
  }

  return res.json() as Promise<T>;
}

export async function resolveVanityUrl(
  apiKey: string,
  vanityUrl: string
): Promise<string> {
  const url = `${STEAM_API_BASE}/ISteamUser/ResolveVanityURL/v1/?key=${apiKey}&vanityurl=${encodeURIComponent(vanityUrl)}`;
  const data = await steamGet<SteamVanityUrlResponse>(url);
  if (data.response.success !== 1 || !data.response.steamid) {
    throw new Error(
      `Could not resolve Steam vanity URL "${vanityUrl}". Check that your username is correct.`
    );
  }
  return data.response.steamid;
}

export async function getPlayerSummary(
  apiKey: string,
  steamId: string
): Promise<SteamPlayerSummary> {
  const url = `${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId}`;
  const data = await steamGet<SteamPlayerSummariesResponse>(url);
  const player = data.response.players[0];
  if (!player) {
    throw new Error(`No Steam profile found for ID "${steamId}".`);
  }
  return player;
}

export async function getOwnedGames(
  apiKey: string,
  steamId: string
): Promise<SteamGame[]> {
  const url = `${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamId}&include_appinfo=true&include_played_free_games=true`;
  const data = await steamGet<SteamOwnedGamesResponse>(url);
  const games = data.response?.games;
  if (!games) {
    // Empty response usually means private profile
    throw new Error(
      "Steam returned no library data. Make sure your Steam profile and game library are set to Public in Steam → Privacy Settings."
    );
  }
  return games;
}

export async function getRecentlyPlayed(
  apiKey: string,
  steamId: string,
  count: number = 10
): Promise<SteamGame[]> {
  const url = `${STEAM_API_BASE}/IPlayerService/GetRecentlyPlayedGames/v1/?key=${apiKey}&steamid=${steamId}&count=${count}`;
  const data = await steamGet<SteamRecentlyPlayedResponse>(url);
  return data.response?.games ?? [];
}

export async function getAppDetails(
  appid: number
): Promise<SteamAppDetailsData | null> {
  // 200ms delay to respect Steam Store API undocumented rate limits
  await new Promise((resolve) => setTimeout(resolve, 200));
  const url = `${STORE_API_BASE}/appdetails?appids=${appid}`;
  const data = await steamGet<SteamAppDetailsResponse>(url);
  const entry = data[String(appid)];
  if (!entry?.success || !entry.data) {
    return null;
  }
  return entry.data;
}
