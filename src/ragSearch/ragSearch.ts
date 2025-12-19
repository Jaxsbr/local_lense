import { IVectorEmbedder } from "../types";
import { IVectorSearchService, SearchResult } from "./types";
import { CollectionStateService } from "../services/collectionStateService";

/**
 * Static search configuration (doesn't change at runtime)
 */
export interface SearchConfig {
    resultLimit: number;
}

/**
 * Performs RAG (Retrieval-Augmented Generation) searches over indexed documents.
 * Orchestrates: embedding query text and searching vector collections for RAG pipeline.
 * 
 * IMPORTANT: Always uses the current active collection from CollectionStateService.
 * This ensures searches use the correct collection even after re-indexing operations.
 * 
 * Knows nothing about Qdrant, Pinecone, or any specific technology.
 * Only understands domain concepts: embedding text and searching vectors.
 */
export class RAGSearch {
    constructor(
        private embedder: IVectorEmbedder,
        private searchService: IVectorSearchService,
        private collectionState: CollectionStateService,
        private config: SearchConfig
    ) { }

    async search(query: string): Promise<SearchResult[]> {
        // Always get the current active collection dynamically
        // This ensures we search the correct collection even after re-indexing
        const collectionName = this.collectionState.getCurrentCollection();
        const queryVector = await this.embedder.embed(query);
        return await this.searchService.search(
            collectionName,
            queryVector,
            this.config.resultLimit
        );
    }
}
