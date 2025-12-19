/**
 * Domain-focused interfaces for vector search capabilities.
 * These abstract away implementation details - could be Qdrant, Pinecone, or any vector DB.
 */

/**
 * Represents a search result from vector search
 */
export interface SearchResult {
    id: string | number;
    version: number;
    score: number;
    payload?: Record<string, unknown> | { [key: string]: unknown } | null | undefined;
    vector?: number[] | Record<string, unknown> | number[][] | { [key: string]: unknown } | null | undefined;
    shard_key?: string | number | Record<string, unknown> | null | undefined;
    order_value?: number | Record<string, unknown> | null | undefined;
}

/**
 * Capability: Search for similar vectors in a collection
 * Domain concept - not tied to any specific technology
 */
export interface IVectorSearchService {
    search(
        collectionName: string,
        queryVector: number[],
        limit: number
    ): Promise<SearchResult[]>;
}

/**
 * Capability: Manage vector collections (create, delete, verify existence)
 * Domain concept - not tied to any specific technology
 */
export interface IVectorCollectionService {
    collectionExists(collectionName: string): Promise<boolean>;
    createCollection(
        collectionName: string,
        config: { vectorSize: number; distance: "Cosine" | "Euclid" | "Dot" }
    ): Promise<void>;
    getCollectionInfo(collectionName: string): Promise<{ pointsCount: number }>;
    deleteCollection(collectionName: string): Promise<void>;
}

/**
 * Capability: Store/update points in a collection
 * Domain concept - not tied to any specific technology
 */
export interface IVectorStorageService {
    upsert(
        collectionName: string,
        points: Array<{
            id: number;
            vector: number[];
            payload: Record<string, unknown>;
        }>
    ): Promise<void>;
}
