import fs from "node:fs";
import path from "node:path";

import {
    StoryGenerationRequest,
    StoryGenerationResult
} from "./ai-provider.js";

import { createAITask } from "./ai-task.js";

const STORYCRAFT_DIR =
    path.join(
        process.cwd(),
        ".sdlc",
        "storycraft"
    );

const RESPONSE_FILE =
    path.join(
        STORYCRAFT_DIR,
        "ai-response.json"
    );

export function prepareVSCodeAI(
    request: StoryGenerationRequest
): void {
    fs.mkdirSync(
        STORYCRAFT_DIR,
        { recursive: true }
    );

    createAITask(request);

    if (
        fs.existsSync(
            RESPONSE_FILE
        )
    ) {
        fs.unlinkSync(
            RESPONSE_FILE
        );
    }

    console.log("");
    console.log(
        "StoryCraft AI Task Ready"
    );
    console.log(
        "========================"
    );
    console.log("");
    console.log(
        "Open GitHub Copilot Chat or Claude in VS Code."
    );
    console.log("");
    console.log(
        "Run:"
    );
    console.log("");
    console.log(
        "Read .sdlc/storycraft/ai-task.md and execute the StoryCraft task."
    );
    console.log("");
    console.log(
        "The AI must save the JSON result to:"
    );
    console.log("");
    console.log(
        ".sdlc/storycraft/ai-response.json"
    );
    console.log("");
}

export function readVSCodeAIResult():
    StoryGenerationResult {
    if (
        !fs.existsSync(
            RESPONSE_FILE
        )
    ) {
        throw new Error(
            [
                "AI response has not been created.",
                "",
                "Ask GitHub Copilot or Claude to execute:",
                "",
                "Read .sdlc/storycraft/ai-task.md and execute the StoryCraft task.",
                "",
                "The response must be saved to:",
                ".sdlc/storycraft/ai-response.json"
            ].join("\n")
        );
    }

    let data: unknown;

    try {
        data =
            JSON.parse(
                fs.readFileSync(
                    RESPONSE_FILE,
                    "utf8"
                )
            );
    } catch {
        throw new Error(
            "StoryCraft AI response is not valid JSON."
        );
    }

    if (
        typeof data !== "object" ||
        data === null
    ) {
        throw new Error(
            "StoryCraft AI response must be a JSON object."
        );
    }

    const result =
        data as {
            version?: string;
            generatedBy?: string;
            epics?: unknown;
            stories?: unknown;
        };

    if (
        !Array.isArray(
            result.epics
        )
    ) {
        throw new Error(
            "StoryCraft AI response is missing 'epics'."
        );
    }

    if (
        !Array.isArray(
            result.stories
        )
    ) {
        throw new Error(
            "StoryCraft AI response is missing 'stories'."
        );
    }

    return {
        epics:
            result.epics as StoryGenerationResult["epics"],

        stories:
            result.stories as StoryGenerationResult["stories"]
    };
}