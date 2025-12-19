# local-lense

A reusable MCP (Model Context Protocol) tool that enables semantic search across your local documentation directly within Cursor. This tool indexes documentation files and provides vector-based search capabilities through a simple MCP server interface.

## What is local-lense?

local-lense is a RAG (Retrieval-Augmented Generation) powered documentation search tool that:

- **Indexes your local documentation** - Processes markdown, HTML, JSON, YAML, and text files to create a searchable vector index
- **Semantic search** - Uses vector embeddings to find relevant content based on meaning, not just keywords
- **Cursor integration** - Exposes search capabilities via MCP so Cursor AI can search your docs
- **Fast and local** - Everything runs locally with Qdrant vector database
- **Extensible** - Supports custom source processors for indexing content from web, databases, or other sources

## How it works

local-lense uses a RAG (Retrieval-Augmented Generation) architecture:

1. **Indexing Phase**: 
   - Scans your configured documentation directory
   - Splits documents into chunks
   - Generates vector embeddings using transformer models
   - Stores embeddings in Qdrant vector database

2. **Search Phase**:
   - Takes a natural language query
   - Generates an embedding for the query
   - Searches Qdrant for similar document chunks
   - Returns relevant sections with relevance scores

3. **MCP Integration** (Future):
   - Exposes search as MCP tools
   - Cursor AI can query your docs directly
   - Seamless integration with your workflow

## Prerequisites

- **Node.js** (v18 or higher)
- **Docker** and **Docker Compose** (for Qdrant vector database)
- **TypeScript** (installed as dev dependency)

## Quick Start

### 1. Clone the repository

```bash
git clone <repository-url>
cd local-lense
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start Qdrant vector database

```bash
docker-compose up -d
```

This starts a Qdrant container on `localhost:6333`. The data persists in a Docker volume.

### 4. Configure your documentation path

Edit `configs.json`:

```json
{
  "sourcePath": "~/Documents/my-docs",
  "searchResultLimit": 3,
  "currentCollection": "docs_v1"
}
```

- `sourcePath`: Path to your documentation directory (supports `~` for home directory)
- `searchResultLimit`: Maximum number of search results to return
- `currentCollection`: Name of the Qdrant collection to use

### 5. Build the project

```bash
npm run build
```

### 6. Run indexing and search

Currently, the tool runs as a test script. Edit `src/main.ts` to configure your search query, then:

```bash
npm run dev
```

## Configuration

### configs.json

The main configuration file located in the project root:

- **sourcePath** (string, required): Path to your documentation directory
  - Supports `~` for home directory expansion
  - Example: `"~/Documents/my-docs"` or `"/absolute/path/to/docs"`
  
- **searchResultLimit** (number, optional): Maximum number of results per search
  - Default: `3`
  
- **currentCollection** (string, required): Qdrant collection name
  - Used to organize different document sets
  - Example: `"docs_v1"`, `"engineering-docs"`, etc.

### Docker Compose

The `docker-compose.yaml` file configures Qdrant:

- **Port**: `6333` (Qdrant HTTP API)
- **Storage**: Persistent volume `qdrant_storage`
- **Health checks**: Automatic container health monitoring

## Supported File Types

The default `FileSourceProcessor` (see [`src/ragIndexer/implementations/fileSourceProcessor.ts`](src/ragIndexer/implementations/fileSourceProcessor.ts)) supports the following file types:

### Fully Supported
- **Markdown**: `.md`, `.markdown`
- **HTML**: `.html`, `.htm`
- **JSON**: `.json`
- **YAML**: `.yaml`, `.yml`
- **Text**: `.txt`, `.text`

### Other Files
Files with unsupported extensions are processed as `ContentType.OTHER`. While they will be indexed, the content may not be optimally formatted for search.

The processor recursively scans directories and automatically detects file types based on their extensions. All supported files are read as UTF-8 text.

## Custom Source Processors

local-lense uses a pluggable source processor architecture. While the default implementation processes local files, you can implement custom source processors to index content from other sources.

### Implementing a Custom Processor

To create a custom source processor, implement the `ISourceProcessor` interface (see [`src/ragIndexer/types.ts`](src/ragIndexer/types.ts)):

```typescript
import { ISourceProcessor, SourceItem } from './types';

export class MyCustomProcessor implements ISourceProcessor {
    public get sourceItems(): ReadonlyArray<SourceItem> {
        // Return processed source items
    }

    public process(): ReadonlyArray<SourceItem> {
        // Fetch and process content from your source
        // Return array of SourceItem objects with:
        // - sourceLocation: identifier (file path, URL, etc.)
        // - contentType: ContentType enum value
        // - content: the actual content string
    }
}
```

### Example Use Cases for Custom Processors

- **Web Scraping**: Index content from websites or web APIs
- **Database Sources**: Query and index content from databases
- **Cloud Storage**: Index documents from Google Drive, Dropbox, etc.
- **RSS Feeds**: Index blog posts or news articles
- **Git Repositories**: Index code documentation from git repos

See [`src/ragIndexer/types.ts`](src/ragIndexer/types.ts) for the complete interface definition and type definitions.

## Using in Cursor

**Note**: MCP server implementation is planned for a future release. Once implemented, you'll configure it in Cursor settings:

```json
{
  "mcpServers": {
    "local-lense": {
      "command": "node",
      "args": ["/path/to/local-lense/build/index.js"],
      "env": {}
    }
  }
}
```

## Example Use Cases

- **Engineering Documentation**: Search team wikis, architecture docs, API documentation
- **Personal Knowledge Base**: Index your notes, research, and personal documentation
- **Project Documentation**: Quick access to project-specific docs and guides
- **Research Notes**: Semantic search across research papers and notes

## Architecture

```
┌─────────────────┐
│  Documentation  │
│     Files       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ File Processor  │  ← Reads and chunks documents
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Embed Service   │  ← Generates vector embeddings
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Qdrant Store   │  ← Vector database
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Search Query   │  ← User query
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  RAG Search     │  ← Finds similar vectors
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Results        │  ← Relevant document chunks
└─────────────────┘
```

## Troubleshooting

### Qdrant connection errors

- Ensure Docker is running: `docker ps`
- Check Qdrant container: `docker-compose ps`
- Verify port 6333 is available: `curl http://localhost:6333/health`

### Path not found errors

- Verify `sourcePath` in `configs.json` exists
- Use absolute paths or `~` for home directory
- Check file permissions

### Empty search results

- Run indexing first: `await ragIndexer.refresh()` in `main.ts`
- Check collection name matches `currentCollection` in config
- Verify documents were processed (check Qdrant dashboard)

### Build errors

- Ensure TypeScript is installed: `npm install`
- Check Node.js version: `node --version` (should be v18+)
- Clear build cache: `rm -rf build && npm run build`

## Development

### Project Structure

```
local-lense/
├── src/
│   ├── main.ts                    # Entry point (test script)
│   ├── services/                  # Core services
│   │   ├── configService.ts       # Configuration management
│   │   ├── embedService.ts       # Embedding generation
│   │   └── collectionStateService.ts
│   ├── ragIndexer/                # Indexing logic
│   │   ├── ragIndexer.ts
│   │   └── implementations/
│   │       └── fileSourceProcessor.ts
│   └── ragSearch/                 # Search logic
│       ├── ragSearch.ts
│       └── implementations/
│           ├── qdrantVectorSearchService.ts
│           ├── qdrantVectorCollectionService.ts
│           └── qdrantVectorStorageService.ts
├── configs.json                   # Configuration file
├── docker-compose.yaml            # Qdrant setup
└── package.json
```

### Building

```bash
npm run build
```

Output goes to `build/` directory.

### Running Development Mode

```bash
npm run dev
```

Uses `tsx` to run TypeScript directly without building.

## Future Enhancements

- [ ] MCP server implementation for Cursor integration
- [ ] Google Docs sync support
- [ ] Multiple source types (web, databases, etc.)
- [ ] Improved chunking strategies
- [ ] Relevance score tuning
- [ ] Incremental indexing
- [ ] Collection management tools

## License

ISC
