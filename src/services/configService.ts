import { promises as fs } from "fs";
import { join } from "path";
import { homedir } from "os";

/**
 * Static configuration that doesn't change at runtime.
 * Loaded once and cached for the lifetime of the application.
 * User-configurable settings only.
 */
export interface StaticConfig {
    sourcePath: string;
    searchResultLimit: number;
    keywordBoost?: boolean;
    keywordBoostWeight?: number;
}

/**
 * @deprecated Use StaticConfig instead. This is kept for backward compatibility.
 */
export interface Config extends StaticConfig { }

const DEFAULT_CONFIG: StaticConfig = {
    sourcePath: "~/Documents/my-docs",
    searchResultLimit: 3,
    keywordBoost: true,
    keywordBoostWeight: 0.2
};

export class ConfigService {
    private configPath: string;
    private cachedConfig: Config | null = null;

    constructor(configPath?: string) {
        if (configPath) {
            this.configPath = configPath;
        } else {
            // Default to project root configs.json
            const projectRoot = process.cwd();
            this.configPath = join(projectRoot, "configs.json");
        }
    }

    private async readConfig(): Promise<StaticConfig> {
        if (this.cachedConfig) {
            return this.cachedConfig;
        }

        try {
            const fileContent = await fs.readFile(this.configPath, "utf-8");
            const config = JSON.parse(fileContent) as Config;

            // Validate required fields
            if (!config.sourcePath) {
                throw new Error("Config file is missing required field: sourcePath");
            }

            this.cachedConfig = config;
            return config;
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === "ENOENT") {
                // File doesn't exist, create it with defaults
                await this.writeConfig(DEFAULT_CONFIG);
                this.cachedConfig = DEFAULT_CONFIG;
                return DEFAULT_CONFIG;
            }

            if (error instanceof SyntaxError) {
                throw new Error(`Failed to parse config file: ${error.message}`);
            }

            throw error;
        }
    }

    private async writeConfig(config: StaticConfig): Promise<void> {
        const content = JSON.stringify(config, null, 2);
        await fs.writeFile(this.configPath, content, "utf-8");
        this.cachedConfig = config;
    }

    private expandPath(path: string): string {
        if (path.startsWith("~/")) {
            return join(homedir(), path.slice(2));
        }
        return path;
    }

    public async getSourcePath(): Promise<string> {
        const config = await this.readConfig();
        return this.expandPath(config.sourcePath);
    }

    public async getSearchResultLimit(): Promise<number> {
        const config = await this.readConfig();
        return config.searchResultLimit;
    }

    /**
     * Get the static config object once.
     * Prefer this over individual getters to avoid repeated async calls.
     */
    public async getStaticConfig(): Promise<StaticConfig> {
        const config = await this.readConfig();
        return {
            ...config,
            sourcePath: this.expandPath(config.sourcePath),
        };
    }

    /**
     * @deprecated Use getStaticConfig() instead. Kept for backward compatibility.
     */
    public async getConfig(): Promise<StaticConfig> {
        return await this.getStaticConfig();
    }
}

