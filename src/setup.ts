import fs from "fs";
import path from "path";
import os from "os";
import readline from "readline";
import { resolveVanityUrl, getPlayerSummary } from "./steam/client.js";

function getConfigPath(): string {
  switch (process.platform) {
    case "win32":
      return path.join(process.env.APPDATA ?? path.join(os.homedir(), "AppData", "Roaming"), "Claude", "claude_desktop_config.json");
    case "darwin":
      return path.join(os.homedir(), "Library", "Application Support", "Claude", "claude_desktop_config.json");
    default:
      return path.join(os.homedir(), ".config", "Claude", "claude_desktop_config.json");
  }
}

function prompt(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

function isNumericSteamId(value: string): boolean {
  return /^\d{17}$/.test(value);
}

export async function runSetup(): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log("\nsteam-mcp setup\n");
  console.log("You'll need two things:");
  console.log("  1. A Steam Web API key  →  https://steamcommunity.com/dev/apikey");
  console.log("  2. Your Steam ID or vanity URL username\n");

  let apiKey = "";
  let steamId = "";

  // --- API key ---
  while (true) {
    apiKey = (await prompt(rl, "Steam API key: ")).trim();
    if (apiKey.length > 0) break;
    console.log("  API key cannot be empty.");
  }

  // --- Steam ID ---
  while (true) {
    const raw = (await prompt(rl, "Steam ID or vanity URL username: ")).trim();
    if (!raw) {
      console.log("  Steam ID cannot be empty.");
      continue;
    }

    if (isNumericSteamId(raw)) {
      steamId = raw;
      break;
    }

    // Treat as vanity URL
    process.stdout.write("  Resolving vanity URL... ");
    try {
      steamId = await resolveVanityUrl(apiKey, raw);
      console.log("OK");
      break;
    } catch {
      console.log("not found.");
      console.log(`  Couldn't find "${raw}". Check your profile URL: https://steamcommunity.com/id/${raw}`);
      console.log("  Or use your numeric 64-bit Steam ID from https://steamid.io");
    }
  }

  // --- Validate ---
  process.stdout.write("  Validating credentials... ");
  try {
    const profile = await getPlayerSummary(apiKey, steamId);
    if (profile.communityvisibilitystate !== 3) {
      console.log("blocked.\n");
      console.log("Your Steam profile is set to private.");
      console.log("Go to Steam → your profile → Edit Profile → Privacy Settings → set My Profile and Game details to Public, then run setup again.");
      rl.close();
      process.exit(1);
    }
    console.log(`OK (hi, ${profile.personaname}!)`);
  } catch (err) {
    console.log("failed.\n");
    console.log(`Could not validate: ${err instanceof Error ? err.message : String(err)}`);
    console.log("Double-check your API key at https://steamcommunity.com/dev/apikey");
    rl.close();
    process.exit(1);
  }

  rl.close();

  // --- Patch Claude Desktop config ---
  const configPath = getConfigPath();
  let config: Record<string, unknown> = {};

  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    } catch {
      console.log(`\nWarning: could not parse existing config at ${configPath}. It may be overwritten.`);
    }
  }

  if (!config.mcpServers || typeof config.mcpServers !== "object") {
    config.mcpServers = {};
  }

  (config.mcpServers as Record<string, unknown>)["steam-mcp"] = {
    command: "npx",
    args: ["-y", "steam-mcp"],
    env: {
      STEAM_API_KEY: apiKey,
      STEAM_ID: steamId,
    },
  };

  const configDir = path.dirname(configPath);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  console.log(`\nConfig written to ${configPath}`);
  console.log("\nAll done! Restart Claude Desktop and your Steam library will be available.\n");
}
