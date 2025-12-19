export enum SourceType {
    FILE = 1,
}

export enum ContentType {
    OTHER = 0, // typically something unsupported
    TEXT = 1,
    MARKDOWN = 2,
    HTML = 3,
    JSON = 4,
    YAML = 5,
}

export interface SourceItem {
    sourceType: SourceType;
    sourceLocation: string;      // any identifiable text. e.g. file path, url
    contentType: ContentType;
    content: string;              // content of the source
}

export interface ISourceProcessor {
    sourceItems: ReadonlyArray<SourceItem>;
    process(): ReadonlyArray<SourceItem>;
}

