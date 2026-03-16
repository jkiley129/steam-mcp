#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { createServer } from "./server.js";

async function main() {
  // Validate config on startup — fail fast with clear errors before accepting connections
  try {
    await loadConfig();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`[steam-mcp] Configuration error:\n${message}\n`);
    process.exit(1);
  }

  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);

  process.stderr.write("[steam-mcp] Server running on stdio\n");
}

main().catch((err) => {
  process.stderr.write(`[steam-mcp] Fatal error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
