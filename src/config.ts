import dotenv from "dotenv";
import { resolveVanityUrl, getPlayerSummary } from "./steam/client.js";

dotenv.config();

export interface Config {
  apiKey: string;
  steamId: string;
}

let _config: Config | null = null;

function isNumericSteamId(value: string): boolean {
  return /^\d{17}$/.test(value);
}

export async function loadConfig(): Promise<Config> {
  if (_config) return _config;

  const apiKey = process.env.STEAM_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "STEAM_API_KEY is not set. Get your API key at: https://steamcommunity.com/dev/apikey"
    );
  }

  const rawSteamId = process.env.STEAM_ID?.trim();
  if (!rawSteamId) {
    throw new Error(
      "STEAM_ID is not set. Provide either your 64-bit Steam ID (e.g., 76561198012345678) or your vanity URL username."
    );
  }

  let steamId: string;
  if (isNumericSteamId(rawSteamId)) {
    steamId = rawSteamId;
  } else {
    try {
      steamId = await resolveVanityUrl(apiKey, rawSteamId);
    } catch (err) {
      throw new Error(
        `Could not resolve Steam vanity URL "${rawSteamId}". ` +
        `Check your username at: https://steamcommunity.com/id/${rawSteamId}\n` +
        `Original error: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  // Validate key + check profile visibility
  try {
    const profile = await getPlayerSummary(apiKey, steamId);
    // communityvisibilitystate: 1=private, 3=public
    if (profile.communityvisibilitystate !== 3) {
      throw new Error(
        "Your Steam profile is private. Set it to Public in Steam → your profile → Edit Profile → Privacy Settings → My Profile → Public."
      );
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes("private")) throw err;
    throw new Error(
      `Could not validate Steam API key or profile. ` +
      `Check that STEAM_API_KEY is correct: https://steamcommunity.com/dev/apikey\n` +
      `Original error: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  _config = { apiKey, steamId };
  return _config;
}
