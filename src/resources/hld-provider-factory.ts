import {
    LocalHLDProvider
} from "./local-hld-provider.js";

import {
    ConfluenceHLDProvider
} from "./confluence-hld-provider.js";

export interface HLDProvider {
    name: string;

    load(): Promise<{
        source: string;
        content: string;
    }>;
}

export function createHLDProvider(
    providerName: string
): HLDProvider {
    switch (
    providerName.toLowerCase()
    ) {
        case "local":
            return new LocalHLDProvider();

        case "confluence":
            return new ConfluenceHLDProvider();

        default:
            throw new Error(
                `Unsupported HLD provider: ${providerName}`
            );
    }
}