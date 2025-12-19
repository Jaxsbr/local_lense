/**
 * Shared domain interfaces used across multiple modules.
 */

/**
 * Capability: Convert text to vector embeddings
 * Domain concept - not tied to any specific technology
 */
export interface IVectorEmbedder {
    embed(text: string): Promise<number[]>;
}
