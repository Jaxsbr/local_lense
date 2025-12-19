import { StateService } from "./stateService";

/**
 * Manages the current active collection state.
 * This is the single source of truth for which collection is currently active.
 * Unlike static config, this state changes during re-indexing operations.
 * 
 * IMPORTANT: Automatically persists state changes to .local-lense-state.json.
 * This ensures the current collection survives service restarts.
 * This is internal state - users should not modify it.
 */
export class CollectionStateService {
    private _currentCollection: string;
    private _stateService: StateService;

    constructor(initialCollection: string, stateService: StateService) {
        this._currentCollection = initialCollection;
        this._stateService = stateService;
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
     * This updates both in-memory state AND persists to .local-lense-state.json
     * to ensure the change survives service restarts.
     */
    async updateCurrentCollection(collectionName: string): Promise<void> {
        this._currentCollection = collectionName;
        // Persist to state file so state survives restarts
        await this._stateService.updateCurrentCollection(collectionName);
    }
}

