import { pipeline } from "@xenova/transformers";
import { IVectorEmbedder } from "../types";

export class EmbedService implements IVectorEmbedder {
    embedder: any;

    async loadEmbedder() {
        if (!this.embedder) {
            this.embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
        }
    }

    public async embed(text: string): Promise<number[]> {
        await this.loadEmbedder();
        const output = await this.embedder(text, { pooling: "mean", normalize: true });
        return Array.from(output.data);
    }
}

