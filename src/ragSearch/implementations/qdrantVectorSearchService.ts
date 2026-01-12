import { QdrantClient } from "@qdrant/js-client-rest";
import { IVectorSearchService, SearchResult } from "../types.js";

/**
 * Qdrant implementation of vector search capability.
 * Named for its capability, not its technology.
 */
export class QdrantVectorSearchService implements IVectorSearchService {
    constructor(private client: QdrantClient) { }

    async search(
        collectionName: string,
        queryVector: number[],
        limit: number
    ): Promise<SearchResult[]> {
        const result = await this.client.search(collectionName, {
            vector: queryVector,
            limit,
        });
        return result;
    }
}

