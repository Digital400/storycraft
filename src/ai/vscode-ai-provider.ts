import fs from "node:fs";
import path from "node:path";

import {
    AIProvider,
    StoryGenerationRequest,
    StoryGenerationResult
} from "./ai-provider.js";

export class VSCodeAIProvider
    implements AIProvider {
    name = "vscode";

    private readonly providerName: string;

    constructor(
        providerName: string
    ) {
        this.providerName =
            providerName;
    }

    async generateStories(
        request: StoryGenerationRequest
    ): Promise<StoryGenerationResult> {
        const storycraftPath =
            path.join(
                process.cwd(),
                ".sdlc",
                "storycraft"
            );

        fs.mkdirSync(
            storycraftPath,
            { recursive: true }
        );

        const requestPath =
            path.join(
                storycraftPath,
                "ai-request.json"
            );

        const responsePath =
            path.join(
                storycraftPath,
                "ai-response.json"
            );

        const promptPath =
            path.join(
                storycraftPath,
                "ai-prompt.md"
            );

        const requestDocument = {
            version: "1.0",

            executionMode:
                "vscode",

            requestedProvider:
                this.providerName,

            createdAt:
                new Date().toISOString(),

            instructions:
                buildPrompt(request)
        };

        fs.writeFileSync(
            requestPath,
            JSON.stringify(
                requestDocument,
                null,
                2
            ),
            "utf8"
        );

        fs.writeFileSync(
            promptPath,
            buildPrompt(request),
            "utf8"
        );

        if (
            fs.existsSync(
                responsePath
            )
        ) {
            const response =
                JSON.parse(
                    fs.readFileSync(
                        responsePath,
                        "utf8"
                    )
                );

            return parseResponse(
                response
            );
        }

        throw new Error(
            [
                "",
                "VS Code AI handoff created.",
                "",
                "Open:",
                ".sdlc/storycraft/ai-prompt.md",
                "",
                "Use GitHub Copilot Chat or Claude Chat in VS Code.",
                "",
                "Ask the AI to follow the prompt and save ONLY the JSON response to:",
                ".sdlc/storycraft/ai-response.json",
                "",
                "Then run:",
                "sdlc storycraft generate"
            ].join("\n")
        );
    }
}

function buildPrompt(
    request: StoryGenerationRequest
): string {
    return `
# StoryCraft AI Task

You are working as the AI engine for StoryCraft.

Generate production-quality Epics and User Stories from the supplied:

1. Problem Discovery context
2. Solution Discovery context
3. High-Level Design
4. HLD references

## CRITICAL RULES

- The supplied HLD is the technical source of truth.
- Do not invent features.
- Do not create unrelated example domains.
- Do not use generic examples such as Order Management unless they actually exist in the supplied context.
- Every Epic must map to capabilities explicitly supported by the context/HLD.
- Every Story must belong to an Epic.
- Stories must be independently implementable where practical.
- Acceptance criteria must be testable.
- Technical requirements must be implementation relevant.
- Dependencies must reference existing Story IDs.
- HLD references must identify the relevant HLD section/component.
- Story points must be between 1 and 13.
- Separate MVP requirements from future/out-of-scope requirements.
- Do not convert assumptions into confirmed requirements.
- Do not convert future architecture into MVP implementation.
- Respect security, tenancy, audit, performance and architecture constraints.
- Return ONLY valid JSON.
- Do not use markdown fences.
- Do not add explanations outside JSON.

## REQUIRED JSON

{
  "epics": [
    {
      "id": "EPIC-001",
      "title": "Epic title",
      "description": "Epic description",
      "businessValue": "Business value"
    }
  ],
  "stories": [
    {
      "id": "ST-001",
      "epicId": "EPIC-001",
      "title": "Story title",
      "description": "Story description",
      "businessValue": "Business value",
      "acceptanceCriteria": [
        "Testable criterion"
      ],
      "technicalRequirements": [
        "Technical requirement"
      ],
      "dependencies": [],
      "hldReferences": [
        "Relevant HLD section"
      ],
      "estimate": {
        "storyPoints": 5
      }
    }
  ]
}

## PROBLEM CONTEXT

${JSON.stringify(
        request.context.problem,
        null,
        2
    )}

## SOLUTION CONTEXT

${JSON.stringify(
        request.context.solution,
        null,
        2
    )}

## HLD

Source:

${request.hld.source}

Content:

${request.hld.content}
`;
}

function parseResponse(
    response: unknown
): StoryGenerationResult {
    if (
        typeof response !== "object" ||
        response === null
    ) {
        throw new Error(
            "VS Code AI response is not a valid object."
        );
    }

    const value =
        response as {
            epics?: unknown;
            stories?: unknown;
        };

    if (
        !Array.isArray(
            value.epics
        )
    ) {
        throw new Error(
            "VS Code AI response is missing epics."
        );
    }

    if (
        !Array.isArray(
            value.stories
        )
    ) {
        throw new Error(
            "VS Code AI response is missing stories."
        );
    }

    return {
        epics:
            value.epics as StoryGenerationResult["epics"],

        stories:
            value.stories as StoryGenerationResult["stories"]
    };
}