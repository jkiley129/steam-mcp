#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";
import { runSetup } from "./setup.js";

async function main() {
  if (process.argv[2] === "setup") {
    await runSetup();
    return;
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
