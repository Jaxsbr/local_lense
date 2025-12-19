import { promises as fs } from "fs";
import { join } from "path";

/**
 * Internal state that changes at runtime.
 * This is separate from user configuration.
 * Managed automatically by the system - users should not modify this file.
 */
export interface InternalState {
    currentCollection: string; // Active collection (docs_v1 or docs_v2)
}

const DEFAULT_STATE: InternalState = {
    currentCollection: "docs_v1"
};

const STATE_FILE_NAME = ".local-lense-state.json";

export class StateService {
    private statePath: string;
    private cachedState: InternalState | null = null;

    constructor(projectRoot?: string) {
        if (projectRoot) {
            this.statePath = join(projectRoot, STATE_FILE_NAME);
        } else {
            // Default to project root
            const root = process.cwd();
            this.statePath = join(root, STATE_FILE_NAME);
        }
    }

    private async readState(): Promise<InternalState> {
        if (this.cachedState) {
            return this.cachedState;
        }

        try {
            const fileContent = await fs.readFile(this.statePath, "utf-8");
            const state = JSON.parse(fileContent) as InternalState;

            // Validate required fields
            if (!state.currentCollection) {
                throw new Error("State file is missing required field: currentCollection");
            }

            this.cachedState = state;
            return state;
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === "ENOENT") {
                // File doesn't exist, create it with defaults
                await this.writeState(DEFAULT_STATE);
                this.cachedState = DEFAULT_STATE;
                return DEFAULT_STATE;
            }

            if (error instanceof SyntaxError) {
                throw new Error(`Failed to parse state file: ${error.message}`);
            }

            throw error;
        }
    }

    private async writeState(state: InternalState): Promise<void> {
        const content = JSON.stringify(state, null, 2);
        await fs.writeFile(this.statePath, content, "utf-8");
        this.cachedState = state;
    }

    /**
     * Get the current active collection name.
     * This is managed internally by the system.
     */
    public async getCurrentCollection(): Promise<string> {
        const state = await this.readState();
        return state.currentCollection;
    }

    /**
     * Update the current active collection.
     * Called automatically during refresh operations.
     * Users should not call this directly.
     */
    public async updateCurrentCollection(collection: string): Promise<void> {
        const state = await this.readState();
        state.currentCollection = collection;
        await this.writeState(state);
    }
}

