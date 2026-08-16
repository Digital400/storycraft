export interface HLDDocument {
    source: string;
    content: string;
}

export class ConfluenceHLDProvider {
    name = "confluence";

    private readonly baseUrl: string;
    private readonly email: string;
    private readonly apiToken: string;
    private readonly pageId: string;

    constructor() {
        const baseUrl =
            process.env.CONFLUENCE_BASE_URL;

        const email =
            process.env.CONFLUENCE_EMAIL;

        const apiToken =
            process.env.CONFLUENCE_API_TOKEN;

        const pageId =
            process.env.CONFLUENCE_HLD_PAGE_ID;

        if (!baseUrl) {
            throw new Error(
                "CONFLUENCE_BASE_URL environment variable is not set."
            );
        }

        if (!email) {
            throw new Error(
                "CONFLUENCE_EMAIL environment variable is not set."
            );
        }

        if (!apiToken) {
            throw new Error(
                "CONFLUENCE_API_TOKEN environment variable is not set."
            );
        }

        if (!pageId) {
            throw new Error(
                "CONFLUENCE_HLD_PAGE_ID environment variable is not set."
            );
        }

        this.baseUrl =
            baseUrl.replace(/\/+$/, "");

        this.email = email;
        this.apiToken = apiToken;
        this.pageId = pageId;
    }

    async load(): Promise<HLDDocument> {
        const credentials =
            Buffer.from(
                `${this.email}:${this.apiToken}`
            ).toString("base64");

        const url =
            `${this.baseUrl}/wiki/api/v2/pages/${this.pageId}` +
            `?body-format=storage`;

        const response =
            await fetch(url, {
                method: "GET",
                headers: {
                    Accept:
                        "application/json",
                    Authorization:
                        `Basic ${credentials}`
                }
            });

        if (!response.ok) {
            const errorBody =
                await response.text();

            throw new Error(
                `Confluence HLD request failed (${response.status} ${response.statusText}): ${errorBody}`
            );
        }

        const data =
            await response.json() as {
                id?: string;
                title?: string;
                body?: {
                    storage?: {
                        value?: string;
                    };
                };
            };

        const content =
            data.body?.storage?.value;

        if (!content) {
            throw new Error(
                `Confluence page ${this.pageId} does not contain a readable HLD body.`
            );
        }

        return {
            source:
                `confluence:${data.id ?? this.pageId}:${data.title ?? "HLD"}`,

            content:
                stripConfluenceMarkup(
                    content
                )
        };
    }
}

function stripConfluenceMarkup(
    html: string
): string {
    return html
        .replace(
            /<ac:structured-macro[\s\S]*?<\/ac:structured-macro>/gi,
            ""
        )
        .replace(
            /<ac:[^>]+>/gi,
            ""
        )
        .replace(
            /<\/ac:[^>]+>/gi,
            ""
        )
        .replace(
            /<ri:[^>]+\/>/gi,
            ""
        )
        .replace(
            /<br\s*\/?>/gi,
            "\n"
        )
        .replace(
            /<\/p>/gi,
            "\n"
        )
        .replace(
            /<\/li>/gi,
            "\n"
        )
        .replace(
            /<[^>]+>/g,
            ""
        )
        .replace(
            /&nbsp;/gi,
            " "
        )
        .replace(
            /&amp;/gi,
            "&"
        )
        .replace(
            /&lt;/gi,
            "<"
        )
        .replace(
            /&gt;/gi,
            ">"
        )
        .replace(
            /&#39;/gi,
            "'"
        )
        .replace(
            /&quot;/gi,
            '"'
        )
        .replace(
            /\n\s*\n\s*\n+/g,
            "\n\n"
        )
        .trim();
}