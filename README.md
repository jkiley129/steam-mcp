# steam-mcp

[![steam-mcp MCP server](https://glama.ai/mcp/servers/jkiley129/steam-mcp/badges/card.svg)](https://glama.ai/mcp/servers/jkiley129/steam-mcp)

A local [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server that connects Claude to your Steam library. Ask natural-language questions about your games without ever touching the API yourself.

[![steam-mcp MCP server](https://glama.ai/mcp/servers/jkiley129/steam-mcp/badges/card.svg)](https://glama.ai/mcp/servers/jkiley129/steam-mcp)

```
"What have I been playing lately?"
"Suggest something from my backlog I haven't touched yet."
"How many hours have I put into RPGs?"
"Tell me about Elden Ring."
```

---

## Tools

| Tool | What it does |
|---|---|
| `get_library` | Your full game library — title, playtime, last played |
| `get_recently_played` | Games played in the last 2 weeks |
| `search_library` | Filter by name, playtime range, or unplayed status |
| `get_game_details` | Store metadata — genres, tags, Metacritic score, price |
| `refresh_library` | Clear the cache to fetch fresh data from Steam |

---

## Requirements

- Node.js 18+
- A Steam account with a **public** profile and library
- A Steam Web API key (free, takes 30 seconds to get)

---

## Setup

### 1. Get a Steam API key

Go to [steamcommunity.com/dev/apikey](https://steamcommunity.com/dev/apikey), log in, and register a key. The domain field can be anything (e.g., `localhost`).

### 2. Find your Steam ID

You need either:
- Your **vanity URL username** — the custom part of your profile URL: `steamcommunity.com/id/YOUR_USERNAME`
- Your **64-bit Steam ID** — find it at [steamid.io](https://steamid.io) if you don't have a vanity URL

### 3. Make your profile public

In Steam: your profile → **Edit Profile** → **Privacy Settings** → set **My Profile** and **Game details** to **Public**.

### 4. Run setup

```bash
npx steam-mcp setup
```

This validates your credentials and writes the Claude Desktop config automatically. Restart Claude Desktop when it's done.

<details>
<summary>Manual config (if you prefer)</summary>

Find your Claude Desktop config file:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Add to the `mcpServers` section:

```json
{
  "mcpServers": {
    "steam-mcp": {
      "command": "npx",
      "args": ["-y", "steam-mcp"],
      "env": {
        "STEAM_API_KEY": "your_api_key_here",
        "STEAM_ID": "your_vanity_url_or_64bit_id"
      }
    }
  }
}
```
</details>

---

## Local development

```bash
git clone https://github.com/jkiley129/steam-mcp.git
cd steam-mcp
npm install
cp .env.example .env
# Edit .env with your API key and Steam ID
npm run build
```

To use the local build with Claude Desktop, point the config at the built file:

```json
{
  "mcpServers": {
    "steam": {
      "command": "node",
      "args": ["/absolute/path/to/steam-mcp/dist/index.js"],
      "env": {
        "STEAM_API_KEY": "your_api_key_here",
        "STEAM_ID": "your_vanity_url_or_64bit_id"
      }
    }
  }
}
```

---

## Configuration

| Environment variable | Required | Description |
|---|---|---|
| `STEAM_API_KEY` | Yes | Your Steam Web API key |
| `STEAM_ID` | Yes | Your 64-bit Steam ID or vanity URL username |
| `STEAM_MCP_CACHE_DIR` | No | Override cache directory (default: `~/.steam-mcp/cache/`) |

---

## Caching

Steam data is cached locally to keep responses fast and avoid hitting rate limits:

| Data | Cache TTL |
|---|---|
| Library | 1 hour |
| Recently played | 30 minutes |
| Game details | 24 hours |

Use the `refresh_library` tool to clear the cache immediately (e.g., after buying new games).

---

## Troubleshooting

**"Steam returned no library data"**
Your Steam profile or game library is set to private. Go to Steam → your profile → Edit Profile → Privacy Settings and set both to Public.

**"Could not resolve Steam vanity URL"**
Check that `STEAM_ID` matches the username in your Steam profile URL (`steamcommunity.com/id/YOUR_USERNAME`). Alternatively, use your numeric 64-bit Steam ID.

**"Could not validate Steam API key"**
Verify your API key at [steamcommunity.com/dev/apikey](https://steamcommunity.com/dev/apikey). Keys are tied to your Steam account login.

**Tools not showing in Claude**
Restart Claude Desktop fully (quit from the system tray, not just close the window) after editing the config file. Check that Node.js 18+ is installed by running `node --version` in a terminal.

---

## License

MIT