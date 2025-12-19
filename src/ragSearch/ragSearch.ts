import { IVectorEmbedder } from "../types";
import { IVectorSearchService, SearchResult } from "./types";
import { CollectionStateService } from "../services/collectionStateService";

/**
 * Static search configuration (doesn't change at runtime)
 */
export interface SearchConfig {
    resultLimit: number;
    keywordBoost?: boolean; // Enable keyword-based score boosting
    keywordBoostWeight?: number; // How much to boost (0.0 to 1.0, default 0.2)
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
        const results = await this.searchService.search(
            collectionName,
            queryVector,
            this.config.resultLimit
        );

        // Apply keyword boosting if enabled
        if (this.config.keywordBoost !== false) {
            return this.applyKeywordBoosting(results, query);
        }

        return results;
    }

    /**
     * Extracts meaningful keywords from the query (removes stop words)
     */
    private extractKeywords(query: string): string[] {
        const stopWords = new Set([
            'i', 'need', 'my', 'the', 'a', 'an', 'for', 'on', 'with', 'to', 'at', 'in', 'is', 'are',
            'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
            'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
            'and', 'or', 'but', 'if', 'then', 'else', 'when', 'where', 'why', 'how', 'what', 'which',
            'who', 'whom', 'whose', 'about', 'above', 'across', 'after', 'against', 'along', 'among',
            'around', 'before', 'behind', 'below', 'beneath', 'beside', 'between', 'beyond', 'during',
            'except', 'inside', 'into', 'near', 'outside', 'over', 'since', 'through', 'throughout',
            'under', 'until', 'upon', 'within', 'without'
        ]);

        return query.toLowerCase()
            .split(/\s+/)
            .map(word => word.replace(/[^\w]/g, '')) // Remove punctuation
            .filter(word => word.length > 2 && !stopWords.has(word));
    }

    /**
     * Applies keyword-based score boosting to search results
     */
    private applyKeywordBoosting(results: SearchResult[], query: string): SearchResult[] {
        const keywords = this.extractKeywords(query);
        const boostWeight = this.config.keywordBoostWeight || 0.2;
        const queryLower = query.toLowerCase();

        return results.map(result => {
            let boost = 0;
            const content = typeof result.payload?.content === 'string'
                ? result.payload.content.toLowerCase()
                : '';
            const location = typeof result.payload?.sourceLocation === 'string'
                ? result.payload.sourceLocation.toLowerCase()
                : '';

            // Boost if keywords appear in content
            keywords.forEach(keyword => {
                // Count keyword occurrences in content
                const contentMatches = (content.match(new RegExp(keyword, 'gi')) || []).length;
                if (contentMatches > 0) {
                    boost += 0.1 * Math.min(contentMatches, 3); // Cap at 3x per keyword
                }

                // Boost if keyword appears in file path (stronger signal)
                if (location.includes(keyword)) {
                    boost += 0.15;
                }
            });

            // Strong boost if entire query phrase appears in content
            if (content.includes(queryLower)) {
                boost += 0.25;
            }

            // Apply boost (capped at 1.0)
            const boostedScore = Math.min(result.score + (boost * boostWeight), 1.0);

            return {
                ...result,
                score: boostedScore
            };
        }).sort((a, b) => b.score - a.score); // Re-sort by boosted scores
    }
}
