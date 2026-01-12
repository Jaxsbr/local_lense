/* 

Source Processor

Sources are likely files in hierarchy structures on local PC.

This processor recursively itereates over the directory structures to discover available files.
We need to expose the file path and context for use by consumer

*/

import * as fs from 'fs';
import * as path from 'path';
import { SourceType, ContentType, SourceItem, ISourceProcessor } from '../types.js';

export class FileSourceProcessor implements ISourceProcessor {
    private _sourceRoot: string;
    private _sourceType: SourceType;
    private _sourceItems: SourceItem[] = [];

    constructor(sourceRoot: string) {
        this._sourceRoot = sourceRoot;
        this._sourceType = SourceType.FILE;
        this._sourceItems = [];
    }

    public get sourceType(): SourceType {
        return this._sourceType;
    }

    public get sourceItems(): ReadonlyArray<SourceItem> {
        return this._sourceItems;
    }

    private getContentTypeFromPath(filePath: string): ContentType {
        const extension = path.extname(filePath).slice(1).toLowerCase();

        if (!extension) {
            return ContentType.OTHER;
        }

        switch (extension) {
            case 'md':
            case 'markdown':
                return ContentType.MARKDOWN;
            case 'html':
            case 'htm':
                return ContentType.HTML;
            case 'json':
                return ContentType.JSON;
            case 'yaml':
            case 'yml':
                return ContentType.YAML;
            case 'txt':
            case 'text':
                return ContentType.TEXT;
            default:
                return ContentType.OTHER;
        }
    }

    public process(): ReadonlyArray<SourceItem> {
        // Reset state to allow reprocessing
        this._sourceItems = [];

        this.processPath(this._sourceRoot);
        return this._sourceItems;
    }

    private processPath(currentPath: string): void {
        let stat: fs.Stats;

        try {
            stat = fs.statSync(currentPath);
        } catch (err) {
            console.error(`Failed to stat path ${currentPath}:`, err);
            return;
        }

        // ───────────────────────────────
        // Handle directory
        // ───────────────────────────────
        if (stat.isDirectory()) {
            const entries = fs.readdirSync(currentPath);

            for (const entry of entries) {
                const fullPath = path.join(currentPath, entry);
                this.processPath(fullPath);   // Recurse
            }

            return;
        }

        // ───────────────────────────────
        // Handle file
        // ───────────────────────────────
        if (stat.isFile()) {
            const contentType = this.getContentTypeFromPath(currentPath);

            let content = '';
            try {
                content = fs.readFileSync(currentPath, 'utf8');
            } catch (err) {
                console.error(`Failed to read file ${currentPath}:`, err);
                return;
            }

            this._sourceItems.push({
                sourceType: SourceType.FILE,
                sourceLocation: currentPath,
                contentType,
                content
            });

            return;
        }

        // Ignore other file types (symlinks, sockets, etc.)
    }
}