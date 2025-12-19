import { QdrantClient } from "@qdrant/js-client-rest";
import { IVectorCollectionService } from "../types";

/**
 * Qdrant implementation of collection management capability.
 * Named for its capability, not its technology.
 */
export class QdrantVectorCollectionService implements IVectorCollectionService {
    constructor(private client: QdrantClient) { }

    async collectionExists(collectionName: string): Promise<boolean> {
        const { exists } = await this.client.collectionExists(collectionName);
        return exists;
    }

    async createCollection(
        collectionName: string,
        config: { vectorSize: number; distance: "Cosine" | "Euclid" | "Dot" }
    ): Promise<void> {
        await this.client.createCollection(collectionName, {
            vectors: {
                size: config.vectorSize,
                distance: config.distance as "Cosine" | "Dot" | "Euclid" | "Manhattan",
            },
        });
    }

    async getCollectionInfo(collectionName: string): Promise<{ pointsCount: number }> {
        const collectionInfo = await this.client.getCollection(collectionName);
        return {
            pointsCount: collectionInfo.points_count || 0,
        };
    }

    async deleteCollection(collectionName: string): Promise<void> {
        await this.client.deleteCollection(collectionName);
    }
}

