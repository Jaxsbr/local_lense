#!/usr/bin/env node

import { QdrantClient } from "@qdrant/js-client-rest";
import { ConfigService } from "./src/services/configService.js";
import { EmbedService } from "./src/services/embedService.js";
import { FileSourceProcessor } from "./src/ragIndexer/implementations/fileSourceProcessor.js";
import { RAGIndexer } from "./src/ragIndexer/ragIndexer.js";
import { QdrantVectorCollectionService } from "./src/ragSearch/implementations/qdrantVectorCollectionService.js";
import { QdrantVectorStorageService } from "./src/ragSearch/implementations/qdrantVectorStorageService.js";

async function reindex() {
    try {
        console.error("Starting re-indexing process...");

        const configService = new ConfigService();
        const staticConfig = await configService.getStaticConfig();
        const qdrantClient = new QdrantClient({ host: "localhost", port: 6333 });
        const embedder = new EmbedService(staticConfig.embeddingModel);
        const collectionService = new QdrantVectorCollectionService(qdrantClient);
        const storageService = new QdrantVectorStorageService(qdrantClient);
        const sourceProcessor = new FileSourceProcessor(staticConfig.sourcePath);

        const ragIndexer = new RAGIndexer(
            sourceProcessor,
            embedder,
            collectionService,
            storageService,
            staticConfig
        );

        // The init() method handles:
        // - Deleting existing collection if it exists
        // - Creating new collection
        // - Processing all source files
        // - Generating embeddings
        // - Storing vectors in Qdrant
        await ragIndexer.init();

        console.error("Successfully re-indexed the documentation store. All files from the configured source path have been processed, embedded, and stored in the vector database. The search index is now up to date.");
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Re-indexing failed: ${errorMessage}`);
        process.exit(1);
    }
}

reindex();


