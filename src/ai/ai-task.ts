import fs from "node:fs";
import path from "node:path";

import {
    StoryGenerationRequest
} from "./ai-provider.js";

export function createAITask(
    request: StoryGenerationRequest
): string {
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

    const prompt = buildPrompt(
        request
    );

    fs.writeFileSync(
        path.join(
            storycraftPath,
            "ai-task.md"
        ),
        prompt,
        "utf8"
    );

    return prompt;
}

function buildPrompt(
    request: StoryGenerationRequest
): string {
    return `
# StoryCraft AI Developer Task

You are operating as the AI engine for StoryCraft.

Your task is to generate production-ready software Epics and User Stories from the project's actual SDLC context.

DO NOT invent requirements.

DO NOT use generic example domains.

DO NOT create fake Order Management stories.

The supplied Problem Discovery, Solution Discovery and HLD are the source of truth.

---

## EXECUTION RULES

1. Read the supplied context carefully.
2. Understand the actual business problem.
3. Understand the actual proposed solution.
4. Understand the actual HLD.
5. Identify real product capabilities.
6. Group capabilities into meaningful Epics.
7. Create implementation-ready Stories.
8. Keep MVP scope separate from future scope.
9. Do not convert assumptions into requirements.
10. Do not invent APIs, databases or components that are not supported by the HLD.
11. Every Story must belong to an Epic.
12. Acceptance criteria must be testable.
13. Technical requirements must be implementation relevant.
14. Dependencies must reference valid Story IDs.
15. HLD references must reference actual HLD content.
16. Story points must be between 1 and 13.
17. Do not create duplicate Stories.
18. Do not create meaningless technical-only Stories unless required by the HLD.
19. Security, authorization, tenancy, audit and non-functional requirements must be respected.
20. Return ONLY valid JSON.

---

## REQUIRED OUTPUT

{
  "version": "1.0",
  "generatedBy": "ai",
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
        "Testable acceptance criterion"
      ],
      "technicalRequirements": [
        "Technical requirement"
      ],
      "dependencies": [],
      "hldReferences": [
        "Actual HLD reference"
      ],
      "estimate": {
        "storyPoints": 5
      }
    }
  ],
  "tasks": [
    {
      "id": "TASK-001",
      "storyId": "ST-001",
      "title": "Task title",
      "description": "Task description",
      "technicalDetails": [
        "Technical detail"
      ],
      "dependencies": [],
      "estimate": {
        "hours": 6
      }
    }
  ]
}

---

# PROBLEM DISCOVERY

${JSON.stringify(
  request.context.problem.data,
        null,
        2
    )}

---

# SOLUTION DISCOVERY

${JSON.stringify(
  request.context.solution.data,
        null,
        2
    )}

---

# HIGH LEVEL DESIGN

Source:

${request.hld.source}

Content:

${request.hld.content}

---

# FINAL REQUIREMENT

Generate the complete StoryCraft result now.

Return ONLY JSON.

Do not wrap JSON in markdown.

Do not explain your answer.
`;
}