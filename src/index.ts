#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"

import { registerSearchTool } from "./tools/searchTool.js"
import { registerReindexTool } from "./tools/reindexTool.js"

const server = new McpServer(
    {
        name: "local_lense",
        version: "1.0.0"
    },
    {
        capabilities: {
            resources: {},
            tools: {}
        }
    }
)

registerSearchTool(server)
registerReindexTool(server)

async function main() {
    const transport = new StdioServerTransport()
    await server.connect(transport)

    /*
        In STDIO MCP servers, stdout carries protocol messages. 
        Logging with console.log injects non‑protocol text and breaks the stream. 
        Use console.error (stderr) so diagnostics stay separate and tool results remain valid.
    */
    console.error("Local Lense MCP Server running on stdio")
}

main().catch((error) => {
    console.error("Fatal error in main():", error)
    process.exit(1)
})