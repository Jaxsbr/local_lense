import { QdrantClient } from "@qdrant/js-client-rest";
import path from "path";
import { ConfigService } from "./services/configService";
import { EmbedService } from "./services/embedService";
import { FileSourceProcessor } from "./ragIndexer/implementations/fileSourceProcessor";
import { RAGIndexer, DOCS_COLLECTION } from "./ragIndexer/ragIndexer";
import { RAGSearch } from "./ragSearch/ragSearch";
import { SearchResult } from "./ragSearch/types";
import { QdrantVectorSearchService } from "./ragSearch/implementations/qdrantVectorSearchService";
import { QdrantVectorCollectionService } from "./ragSearch/implementations/qdrantVectorCollectionService";
import { QdrantVectorStorageService } from "./ragSearch/implementations/qdrantVectorStorageService";

const configService = new ConfigService();
const staticConfig = await configService.getStaticConfig();
const qdrantClient = new QdrantClient({ host: "localhost", port: 6333 });
const embedder = new EmbedService(staticConfig.embeddingModel);
const searchService = new QdrantVectorSearchService(qdrantClient);
const collectionService = new QdrantVectorCollectionService(qdrantClient);
const storageService = new QdrantVectorStorageService(qdrantClient);
const sourceProcessor = new FileSourceProcessor(staticConfig.sourcePath);

// Initialize collection
const ragIndexer = new RAGIndexer(
    sourceProcessor,
    embedder,
    collectionService,
    storageService,
    staticConfig
);

// Uncomment to refresh the RAG store
// await ragIndexer.init();

// Search collection
const ragSearch = new RAGSearch(
    embedder,
    searchService,
    DOCS_COLLECTION,
    {
        resultLimit: staticConfig.searchResultLimit,
        keywordBoost: staticConfig.keywordBoost ?? true,
        keywordBoostWeight: staticConfig.keywordBoostWeight ?? 0.2,
    }
);
const searchQuery = "guidance on my professional development plan";
const results = await ragSearch.search(searchQuery);


// Test - Display Search Results
console.log("================================");
console.log("QUERY: ", searchQuery);
results.forEach((result: SearchResult) => {

    const isBenchMark = true;
    if (isBenchMark) {
        // Reduced and formatted for benchmark report
        const sourceLocation = result?.payload?.sourceLocation;
        let title = "";
        if (sourceLocation && typeof sourceLocation === 'string') {
            const pathParts = sourceLocation.split(path.sep).filter(part => part !== '');
            // Take up to last 3 parts (2 directories + 1 filename)
            const relevantParts = pathParts.slice(-3);
            title = relevantParts.join(path.sep);
        }
        console.log("SCORE: ", result.score.toFixed(2), " SOURCE: ", title)
    } else {
        // Basic demo output
        console.log("SCORE: ", result.score.toFixed(2))
        console.log("SOURCE: ", result?.payload?.sourceLocation)
        console.log("CONTENT: ", result?.payload?.content);
    }
});

// MCP Tool Registration

// MVP Functionality
// SearchTool              - Finds documents with relevance to user query

// Full Tool Functionality
// ReIndexTool             - Re populates the collections with current version of source docs
// SourceConfigurationTool - Allows the configuration and verification of source paths
// SearchConfigurationTool - Allows the configuration of search settings, result limit, score threshold
