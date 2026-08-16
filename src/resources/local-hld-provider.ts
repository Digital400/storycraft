import fs from "node:fs/promises";
import path from "node:path";

import {
    HLDProvider,
    HLDResource
} from "./hld-provider.js";

export class LocalHLDProvider
    implements HLDProvider {

    name = "local";

    async load(): Promise<HLDResource> {
        const hldPath = path.join(
            process.cwd(),
            ".sdlc",
            "context",
            "hld.json"
        );

        try {
            const content =
                await fs.readFile(
                    hldPath,
                    "utf8"
                );

            return {
                source: hldPath,
                content
            };
        } catch {
            throw new Error(
                `HLD file not found: ${hldPath}`
            );
        }
    }
}