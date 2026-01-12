import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { QdrantClient } from "@qdrant/js-client-rest"
import { ConfigService } from "../services/configService.js"
import { EmbedService } from "../services/embedService.js"
import { FileSourceProcessor } from "../ragIndexer/implementations/fileSourceProcessor.js"
import { RAGIndexer } from "../ragIndexer/ragIndexer.js"
import { QdrantVectorCollectionService } from "../ragSearch/implementations/qdrantVectorCollectionService.js"
import { QdrantVectorStorageService } from "../ragSearch/implementations/qdrantVectorStorageService.js"

// Initialize services at module level (lazy initialization on first tool call)
let ragIndexerInstance: RAGIndexer | null = null
let ragIndexerPromise: Promise<RAGIndexer> | null = null

async function getRagIndexer(): Promise<RAGIndexer> {
    if (ragIndexerInstance) {
        return ragIndexerInstance
    }

    if (ragIndexerPromise) {
        return ragIndexerPromise
    }

    ragIndexerPromise = (async () => {
        const configService = new ConfigService()
        const staticConfig = await configService.getStaticConfig()
        const qdrantClient = new QdrantClient({ host: "localhost", port: 6333 })
        const embedder = new EmbedService(staticConfig.embeddingModel)
        const collectionService = new QdrantVectorCollectionService(qdrantClient)
        const storageService = new QdrantVectorStorageService(qdrantClient)
        const sourceProcessor = new FileSourceProcessor(staticConfig.sourcePath)

        ragIndexerInstance = new RAGIndexer(
            sourceProcessor,
            embedder,
            collectionService,
            storageService,
            staticConfig
        )

        return ragIndexerInstance
    })()

    return ragIndexerPromise
}

async function handleReindex(): Promise<{ content: Array<{ type: "text"; text: string }> }> {
    try {
        const ragIndexer = await getRagIndexer()

        // The init() method handles:
        // - Deleting existing collection if it exists
        // - Creating new collection
        // - Processing all source files
        // - Generating embeddings
        // - Storing vectors in Qdrant
        await ragIndexer.init()

        return {
            content: [
                {
                    type: "text" as const,
                    text: "Successfully re-indexed the documentation store. All files from the configured source path have been processed, embedded, and stored in the vector database. The search index is now up to date."
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

        if (errorMessage.includes("sourcePath") || errorMessage.includes("not found") || errorMessage.includes("ENOENT")) {
            return {
                content: [
                    {
                        type: "text" as const,
                        text: `Source path not found or invalid. Please check your configs.json file and ensure the sourcePath points to a valid directory. Error: ${errorMessage}`
                    }
                ]
            }
        }

        if (errorMessage.includes("collection") || errorMessage.includes("Collection")) {
            return {
                content: [
                    {
                        type: "text" as const,
                        text: `Failed to create or update the vector collection. This may indicate a Qdrant configuration issue. Error: ${errorMessage}`
                    }
                ]
            }
        }

        return {
            content: [
                {
                    type: "text" as const,
                    text: `Re-indexing failed: ${errorMessage}`
                }
            ]
        }
    }
}

export function registerReindexTool(server: McpServer): void {
    server.tool(
        "reindex",
        "Re-index and update the local documentation store. Processes all files in the configured source path, generates embeddings, and rebuilds the vector database. Use this after adding, updating, or removing documentation files to make changes searchable. Also known as: updating the local docs, re-indexing the store, refreshing the documentation index, or rebuilding the search index.",
        {},
        async () => {
            return handleReindex()
        }
    )
}

