export interface HLDResource {
    source: string;
    content: string;
}

export interface HLDProvider {
    name: string;

    load(): Promise<HLDResource>;
}