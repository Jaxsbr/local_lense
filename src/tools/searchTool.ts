import { z } from "zod"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { QdrantClient } from "@qdrant/js-client-rest"
import { ConfigService } from "../services/configService.js"
import { EmbedService } from "../services/embedService.js"
import { RAGSearch } from "../ragSearch/ragSearch.js"
import { DOCS_COLLECTION } from "../ragIndexer/ragIndexer.js"
import { QdrantVectorSearchService } from "../ragSearch/implementations/qdrantVectorSearchService.js"
import { SearchResult } from "../ragSearch/types.js"

// Initialize services at module level (lazy initialization on first tool call)
let ragSearchInstance: RAGSearch | null = null
let ragSearchPromise: Promise<RAGSearch> | null = null

async function getRagSearch(): Promise<RAGSearch> {
    if (ragSearchInstance) {
        return ragSearchInstance
    }

    if (ragSearchPromise) {
        return ragSearchPromise
    }

    ragSearchPromise = (async () => {
        const configService = new ConfigService()
        const staticConfig = await configService.getStaticConfig()
        const qdrantClient = new QdrantClient({ host: "localhost", port: 6333 })
        const embedder = new EmbedService(staticConfig.embeddingModel)
        const searchService = new QdrantVectorSearchService(qdrantClient)

        ragSearchInstance = new RAGSearch(
            embedder,
            searchService,
            DOCS_COLLECTION,
            {
                resultLimit: staticConfig.searchResultLimit,
                keywordBoost: staticConfig.keywordBoost ?? true,
                keywordBoostWeight: staticConfig.keywordBoostWeight ?? 0.2,
            }
        )

        return ragSearchInstance
    })()

    return ragSearchPromise
}

function formatSearchResults(results: SearchResult[]): string {
    if (results.length === 0) {
        return "No results found for your query."
    }

    const formattedResults = results.map((result, index) => {
        const score = result.score.toFixed(2)
        const sourceLocation = result?.payload?.sourceLocation || "Unknown source"
        const content = result?.payload?.content || "No content available"

        return `Result ${index + 1} (Score: ${score}):
Source: ${sourceLocation}
Content: ${content}
---`
    })

    return formattedResults.join("\n\n")
}

async function handleSearch(query: string): Promise<{ content: Array<{ type: "text"; text: string }> }> {
    try {
        const ragSearch = await getRagSearch()
        const results = await ragSearch.search(query)
        const formattedOutput = formatSearchResults(results)

        return {
            content: [
                {
                    type: "text" as const,
                    text: formattedOutput
                }
            ]
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        
        // Check for common error scenarios
        if (errorMessage.includes("connection") || errorMessage.includes("ECONNREFUSED")) {
            return {
                content: [
                    {
                        type: "text" as const,
                        text: `Failed to connect to Qdrant vector database. Please ensure Qdrant is running (docker-compose up -d) and accessible on localhost:6333. Error: ${errorMessage}`
                    }
                ]
            }
        }

        if (errorMessage.includes("collection") || errorMessage.includes("not found")) {
            return {
                content: [
                    {
                        type: "text" as const,
                        text: `Collection not found or not indexed. Please run indexing first to populate the vector database. Error: ${errorMessage}`
                    }
                ]
            }
        }

        return {
            content: [
                {
                    type: "text" as const,
                    text: `Search failed: ${errorMessage}`
                }
            ]
        }
    }
}

export function registerSearchTool(server: McpServer): void {
    // @ts-expect-error - Type instantiation depth issue with MCP SDK type inference
    server.tool(
        "search",
        "Search local documentation using semantic search. Finds documents relevant to your query based on meaning, not just keywords.",
        {
            query: z.string().describe("The search query to find relevant documentation")
        },
        async ({ query }) => {
            return handleSearch(query)
        }
    )
}

