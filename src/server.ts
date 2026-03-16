import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getLibrary } from "./tools/get-library.js";
import { getRecentlyPlayedGames } from "./tools/get-recently-played.js";
import { searchLibrary } from "./tools/search-library.js";
import { getGameDetails } from "./tools/get-game-details.js";
import { refreshLibrary } from "./tools/refresh-library.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "steam-mcp",
    version: "0.1.0",
  });

  // get_library
  server.tool(
    "get_library",
    "Get your full Steam game library with playtime and last-played date for each game.",
    {
      include_unplayed: z
        .boolean()
        .optional()
        .default(true)
        .describe("Include games with 0 playtime (default: true)"),
    },
    async ({ include_unplayed }) => {
      try {
        const games = await getLibrary(include_unplayed);
        return { content: [{ type: "text", text: JSON.stringify(games, null, 2) }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text", text: `Error: ${msg}` }], isError: true };
      }
    }
  );

  // get_recently_played
  server.tool(
    "get_recently_played",
    "Get games played in the last 2 weeks, with hours played this period and total.",
    {
      count: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .default(10)
        .describe("Number of games to return (default: 10, max: 100)"),
    },
    async ({ count }) => {
      try {
        const games = await getRecentlyPlayedGames(count);
        return { content: [{ type: "text", text: JSON.stringify(games, null, 2) }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text", text: `Error: ${msg}` }], isError: true };
      }
    }
  );

  // search_library
  server.tool(
    "search_library",
    "Search and filter your Steam library by name, playtime range, or unplayed status.",
    {
      query: z.string().optional().describe("Case-insensitive name search"),
      min_hours: z.number().optional().describe("Minimum playtime in hours"),
      max_hours: z.number().optional().describe("Maximum playtime in hours"),
      unplayed_only: z
        .boolean()
        .optional()
        .describe("Only return games with 0 playtime"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(250)
        .optional()
        .default(20)
        .describe("Max results to return (default: 20)"),
    },
    async (params) => {
      try {
        const games = await searchLibrary(params);
        return { content: [{ type: "text", text: JSON.stringify(games, null, 2) }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text", text: `Error: ${msg}` }], isError: true };
      }
    }
  );

  // get_game_details
  server.tool(
    "get_game_details",
    "Get store details for a game — description, genres, tags, release date, Metacritic score, and price. Accepts game name or appid.",
    {
      name: z
        .string()
        .optional()
        .describe("Game name (case-insensitive substring match against your library)"),
      appid: z.number().int().optional().describe("Steam app ID"),
    },
    async ({ name, appid }) => {
      try {
        const details = await getGameDetails({ name, appid });
        return { content: [{ type: "text", text: JSON.stringify(details, null, 2) }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text", text: `Error: ${msg}` }], isError: true };
      }
    }
  );

  // refresh_library
  server.tool(
    "refresh_library",
    "Clear the local cache so the next query fetches fresh data from Steam. Use after buying new games.",
    {},
    async () => {
      try {
        const result = refreshLibrary();
        return { content: [{ type: "text", text: result.message }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text", text: `Error: ${msg}` }], isError: true };
      }
    }
  );

  return server;
}
