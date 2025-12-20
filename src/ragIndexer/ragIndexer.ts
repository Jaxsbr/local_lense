import { ISourceProcessor, SourceItem } from "./types";
import { StaticConfig } from "../services/configService";
import { CollectionStateService } from "../services/collectionStateService";
import { IVectorEmbedder } from "../types";
import {
    IVectorCollectionService,
    IVectorStorageService,
} from "../ragSearch/types";

const DOCS_V1 = "docs_v1";
const DOCS_V2 = "docs_v2";
const VECTOR_DISTANCE = "Cosine";
const BATCH_SIZE = 250;
const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 1000;

interface VerificationResult {
    requiresPopulation: boolean;
}

interface CustomPoint {
    id: number;
    vector: number[];
    payload: {
        content: string;
        contentType: number;
        sourceType: number;
        sourceLocation: string;
    }
}

/**
 * Indexes documents into vector collections for RAG (Retrieval-Augmented Generation) pipeline.
 * Orchestrates: processing source documents, generating embeddings, and storing in vector collections.
 * Uses domain interfaces - technology-agnostic in its orchestration logic.
 */
export class RAGIndexer {
    private _fileProcessor: ISourceProcessor;
    private _embedder: IVectorEmbedder;
    private _collectionService: IVectorCollectionService;
    private _storageService: IVectorStorageService;
    private _collectionState: CollectionStateService;
    private _staticConfig: StaticConfig | null = null;

    constructor(
        fileProcessor: ISourceProcessor,
        embedder: IVectorEmbedder,
        collectionService: IVectorCollectionService,
        storageService: IVectorStorageService,
        collectionState: CollectionStateService,
        staticConfig: StaticConfig
    ) {
        this._fileProcessor = fileProcessor;
        this._embedder = embedder;
        this._collectionService = collectionService;
        this._storageService = storageService;
        this._collectionState = collectionState;
        this._staticConfig = staticConfig;
    }

    public async init(): Promise<void> {
        const currentCollection = this._collectionState.getCurrentCollection();
        console.log(`Initializing with collection: ${currentCollection}`);
        const { requiresPopulation } = await this.verifyCollection(currentCollection);
        if (requiresPopulation) {
            console.log(`Collection requires population, starting...`);
            await this.populate(currentCollection);
        } else {
            console.log(`Collection already populated, skipping population`);
        }
    }

    private async verifyCollection(collectionName: string): Promise<VerificationResult> {
        const exists = await this._collectionService.collectionExists(collectionName);

        if (!exists) {
            if (!this._staticConfig) {
                throw new Error("StaticConfig is required to create collection");
            }
            await this._collectionService.createCollection(collectionName, {
                vectorSize: this._staticConfig.vectorSize,
                distance: VECTOR_DISTANCE,
            });
            return { requiresPopulation: true };
        }

        // Check if collection is empty
        const { pointsCount } = await this._collectionService.getCollectionInfo(collectionName);
        console.log(`Collection ${collectionName} exists with ${pointsCount} points`);

        return { requiresPopulation: pointsCount === 0 };
    }

    public async refresh(): Promise<void> {
        // Get current collection and determine next version
        const currentCollection = this._collectionState.getCurrentCollection();
        const nextCollection = currentCollection == DOCS_V1 ? DOCS_V2 : DOCS_V1;

        // Create and populate next collection
        const { requiresPopulation } = await this.verifyCollection(nextCollection);
        if (requiresPopulation) {
            await this.populate(nextCollection);
        }

        // Update the collection state (single source of truth)
        // This automatically updates all components that depend on it
        // AND persists to .local-lense-state.json so it survives restarts
        await this._collectionState.updateCurrentCollection(nextCollection);

        // Delete previous collection version
        const exists = await this._collectionService.collectionExists(currentCollection);
        if (exists) {
            await this._collectionService.deleteCollection(currentCollection);
        }
    }

    private async generatePoints(sourceItems: ReadonlyArray<SourceItem>): Promise<Array<CustomPoint>> {
        const points: Array<CustomPoint> = [];
        for (let index = 0; index < sourceItems.length; index++) {
            const sourceItem = sourceItems[index];
            points.push({
                id: index,
                vector: await this._embedder.embed(sourceItem.content),
                payload: {
                    content: sourceItem.content,
                    contentType: sourceItem.contentType,
                    sourceType: sourceItem.sourceType,
                    sourceLocation: sourceItem.sourceLocation,
                },
            });
        }
        return points;
    }

    private chunk<T>(arr: T[], size: number): T[][] {
        if (size <= 0) throw new Error("Chunk size must be > 0");
        const chunks: T[][] = [];
        for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size));
        }
        return chunks;
    }

    private async upsertWithRetry(
        collectionName: string,
        batch: Array<CustomPoint>,
        batchIndex: number,
        totalBatches: number,
        totalPoints: number
    ): Promise<void> {
        let retries = 0;
        while (retries < MAX_RETRIES) {
            try {
                await this._storageService.upsert(collectionName, batch);
                const startIdx = batchIndex * BATCH_SIZE;
                const endIdx = Math.min((batchIndex + 1) * BATCH_SIZE, totalPoints) - 1;
                console.log(`Batch upload ${batchIndex + 1}/${totalBatches}: ${startIdx} - ${endIdx}`);
                return; // Success, exit retry loop
            } catch (error) {
                retries++;
                const errorMessage = error instanceof Error ? error.message : String(error);

                if (retries < MAX_RETRIES) {
                    console.log(`Batch ${batchIndex + 1} failed (attempt ${retries}/${MAX_RETRIES}), retrying in ${RETRY_DELAY_MS}ms...`);
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
                    continue;
                }

                throw new Error(
                    `Failed to upload batch ${batchIndex + 1}/${totalBatches} after ${retries} attempts: ${errorMessage}`
                );
            }
        }
    }

    private async populate(collectionName: string): Promise<void> {
        console.log(`Starting population of collection: ${collectionName}`);
        const sourceItems = this._fileProcessor.process();
        const points = await this.generatePoints(sourceItems);
        const batches = this.chunk(points, BATCH_SIZE);

        for (let i = 0; i < batches.length; i++) {
            await this.upsertWithRetry(collectionName, batches[i], i, batches.length, points.length);
        }
        console.log(`Population complete for collection: ${collectionName}`);
    }
}