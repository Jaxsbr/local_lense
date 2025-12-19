import { QdrantClient } from "@qdrant/js-client-rest";
import { ConfigService } from "./services/configService";
import { StateService } from "./services/stateService";
import { CollectionStateService } from "./services/collectionStateService";
import { EmbedService } from "./services/embedService";
import { FileSourceProcessor } from "./ragIndexer/implementations/fileSourceProcessor";
import { RAGIndexer } from "./ragIndexer/ragIndexer";
import { RAGSearch } from "./ragSearch/ragSearch";
import { SearchResult } from "./ragSearch/types";
import { QdrantVectorSearchService } from "./ragSearch/implementations/qdrantVectorSearchService";
import { QdrantVectorCollectionService } from "./ragSearch/implementations/qdrantVectorCollectionService";
import { QdrantVectorStorageService } from "./ragSearch/implementations/qdrantVectorStorageService";

const configService = new ConfigService();
const stateService = new StateService();
const staticConfig = await configService.getStaticConfig();
const initialCollection = await stateService.getCurrentCollection();
const collectionState = new CollectionStateService(initialCollection, stateService);
const qdrantClient = new QdrantClient({ host: "localhost", port: 6333 });
const embedder = new EmbedService();
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
    collectionState,
    staticConfig
);
await ragIndexer.init();


// Run 'refresh' to update stale RAG, e.g. when source documents have changed
// await ragIndexer.refresh();


// Search collection
const ragSearch = new RAGSearch(
    embedder,
    searchService,
    collectionState,
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
    console.log("SCORE: ", result.score)
    console.log("SOURCE: ", result?.payload?.sourceLocation)
    // console.log("CONTENT: ", result?.payload?.content);
});

// MCP Tool Registration (Future implementation)
// ReIndexTool             - Re populates the collections with current version of source docs
// SourceConfigurationTool - Allows the configuration and verification of source paths
// SearchConfigurationTool - Allows the configuration of search settings, result limit, score threshold
// SearchTool              - Finds documents with relevance to user query
