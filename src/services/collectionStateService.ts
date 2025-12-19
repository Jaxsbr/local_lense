import { ConfigService } from "./configService";

/**
 * Manages the current active collection state.
 * This is the single source of truth for which collection is currently active.
 * Unlike static config, this state changes during re-indexing operations.
 * 
 * IMPORTANT: Automatically persists state changes to config.json.
 * This ensures the current collection survives service restarts.
 */
export class CollectionStateService {
    private _currentCollection: string;
    private _configService: ConfigService;

    constructor(initialCollection: string, configService: ConfigService) {
        this._currentCollection = initialCollection;
        this._configService = configService;
    }

    /**
     * Get the current active collection name.
     * Always returns the latest value - no caching.
     */
    getCurrentCollection(): string {
        return this._currentCollection;
    }

    /**
     * Update the current active collection.
     * Called by RAGIndexer when refreshing/re-indexing.
     * 
     * This updates both in-memory state AND persists to config.json
     * to ensure the change survives service restarts.
     */
    async updateCurrentCollection(collectionName: string): Promise<void> {
        this._currentCollection = collectionName;
        // Persist to config.json so state survives restarts
        await this._configService.updateCurrentCollection(collectionName);
    }
}

