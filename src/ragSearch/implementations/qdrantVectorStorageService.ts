import { QdrantClient } from "@qdrant/js-client-rest";
import { IVectorStorageService } from "../types";

/**
 * Qdrant implementation of vector storage capability.
 * Named for its capability, not its technology.
 */
export class QdrantVectorStorageService implements IVectorStorageService {
    constructor(private client: QdrantClient) { }

    async upsert(
        collectionName: string,
        points: Array<{
            id: number;
            vector: number[];
            payload: Record<string, unknown>;
        }>
    ): Promise<void> {
        await this.client.upsert(collectionName, { points });
    }
}

