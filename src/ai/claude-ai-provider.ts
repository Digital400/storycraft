import {
    AIProvider,
    StoryGenerationRequest,
    StoryGenerationResult
} from "./ai-provider.js";

export class ClaudeAIProvider implements AIProvider {
    name = "claude";

    async generateStories(
        request: StoryGenerationRequest
    ): Promise<StoryGenerationResult> {
        const apiKey =
            process.env.ANTHROPIC_API_KEY;

        const model =
            process.env.ANTHROPIC_MODEL;

        if (!apiKey) {
            throw new Error(
                "ANTHROPIC_API_KEY environment variable is not set."
            );
        }

        if (!model) {
            throw new Error(
                "ANTHROPIC_MODEL environment variable is not set."
            );
        }

        const prompt =
            buildStoryGenerationPrompt(
                request
            );

        const response =
            await fetch(
                "https://api.anthropic.com/v1/messages",
                {
                    method: "POST",

                    headers: {
                        "content-type":
                            "application/json",

                        "x-api-key":
                            apiKey,

                        "anthropic-version":
                            "2023-06-01"
                    },

                    body: JSON.stringify({
                        model,

                        max_tokens: 12000,

                        temperature: 0,

                        system:
                            "You are StoryCraft, a software SDLC story generation engine. Return only valid JSON matching the requested schema.",

                        messages: [
                            {
                                role: "user",
                                content: prompt
                            }
                        ]
                    })
                }
            );

        if (!response.ok) {
            const errorBody =
                await response.text();

            throw new Error(
                `Claude API request failed (${response.status} ${response.statusText}): ${errorBody}`
            );
        }

        const data =
            await response.json() as {
                content?: Array<{
                    type?: string;
                    text?: string;
                }>;
            };

        const text =
            data.content
                ?.filter(
                    (item) =>
                        item.type === "text"
                )
                .map(
                    (item) =>
                        item.text ?? ""
                )
                .join("")
                .trim();

        if (!text) {
            throw new Error(
                "Claude returned an empty response."
            );
        }

        return parseStoryGenerationResult(
            text
        );
    }
}

function buildStoryGenerationPrompt(
    request: StoryGenerationRequest
): string {
    return `
Generate software Epics and User Stories from the supplied StoryCraft context and HLD.

IMPORTANT RULES:

1. Use the supplied context as the source of truth.
2. Use the HLD as the technical source of truth.
3. Do not invent requirements that are not supported by the context or HLD.
4. Every story must belong to an Epic.
5. Acceptance criteria must be testable.
6. Technical requirements must be implementation relevant.
7. Include HLD references.
8. Identify dependencies between stories.
9. Story points must be between 1 and 13.
10. Generate implementation-ready stories.
11. Return ONLY JSON.
12. Do not wrap the JSON in markdown code fences.

Required JSON structure:

{
  "epics": [
    {
      "id": "EPIC-001",
      "title": "...",
      "description": "...",
      "businessValue": "..."
    }
  ],
  "stories": [
    {
      "id": "ST-001",
      "epicId": "EPIC-001",
      "title": "...",
      "description": "...",
      "businessValue": "...",
      "acceptanceCriteria": [
        "..."
      ],
      "technicalRequirements": [
        "..."
      ],
      "dependencies": [],
      "hldReferences": [
        "..."
      ],
      "estimate": {
        "storyPoints": 5
      }
    }
  ]
}

STORYCRAFT CONTEXT:

${JSON.stringify(
        request.context,
        null,
        2
    )}

HLD:

${JSON.stringify(
        request.hld,
        null,
        2
    )}
`;
}

function parseStoryGenerationResult(
    responseText: string
): StoryGenerationResult {
    let jsonText =
        responseText.trim();

    if (
        jsonText.startsWith(
            "```"
        )
    ) {
        jsonText =
            jsonText
                .replace(
                    /^```(?:json)?\s*/i,
                    ""
                )
                .replace(
                    /\s*```$/,
                    ""
                )
                .trim();
    }

    let parsed: unknown;

    try {
        parsed =
            JSON.parse(
                jsonText
            );
    } catch {
        throw new Error(
            "Claude returned invalid JSON."
        );
    }

    if (
        typeof parsed !== "object" ||
        parsed === null
    ) {
        throw new Error(
            "Claude response is not a valid StoryCraft object."
        );
    }

    const result =
        parsed as {
            epics?: unknown;
            stories?: unknown;
        };

    if (
        !Array.isArray(
            result.epics
        )
    ) {
        throw new Error(
            "Claude response is missing the epics array."
        );
    }

    if (
        !Array.isArray(
            result.stories
        )
    ) {
        throw new Error(
            "Claude response is missing the stories array."
        );
    }

    return {
        epics:
            result.epics as StoryGenerationResult["epics"],

        stories:
            result.stories as StoryGenerationResult["stories"]
    };
}