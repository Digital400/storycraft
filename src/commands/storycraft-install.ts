import fs from "node:fs";
import path from "node:path";

export function installStoryCraft(): void {
    const projectRoot = process.cwd();

    const sdlcPath = path.join(
        projectRoot,
        ".sdlc"
    );

    const githubPath = path.join(
        projectRoot,
        ".github"
    );

    const promptsPath = path.join(
        githubPath,
        "prompts"
    );

    fs.mkdirSync(
        sdlcPath,
        { recursive: true }
    );

    fs.mkdirSync(
        promptsPath,
        { recursive: true }
    );

    const copilotInstructionsPath =
        path.join(
            githubPath,
            "copilot-instructions.md"
        );

    const storyCraftPromptPath =
        path.join(
            promptsPath,
            "storycraft.md"
        );

    if (
        !fs.existsSync(
            copilotInstructionsPath
        )
    ) {
        fs.writeFileSync(
            copilotInstructionsPath,
            createCopilotInstructions(),
            "utf8"
        );

        console.log(
            "✓ Created .github/copilot-instructions.md"
        );
    } else {
        console.log(
            "• .github/copilot-instructions.md already exists"
        );
    }

    if (
        !fs.existsSync(
            storyCraftPromptPath
        )
    ) {
        fs.writeFileSync(
            storyCraftPromptPath,
            createStoryCraftPrompt(),
            "utf8"
        );

        console.log(
            "✓ Created .github/prompts/storycraft.md"
        );
    } else {
        console.log(
            "• .github/prompts/storycraft.md already exists"
        );
    }

    console.log("");
    console.log(
        "StoryCraft installation completed."
    );
    console.log("");
    console.log(
        "You can now use StoryCraft with VS Code and GitHub Copilot."
    );
    console.log("");
}

function createCopilotInstructions(): string {
    return `# StoryCraft Developer Instructions

This project uses Digital400 StoryCraft for developer-driven SDLC automation.

## Core Principle

StoryCraft is developer-driven software development.

Do not independently invent requirements, architecture, business rules, or implementation decisions.

Use the supplied project context and HLD as the primary source of truth.

## StoryCraft Context

Project context is stored under:

.sdlc/context/

Important files:

- problem.json
- solution.json
- hld.json

Generated StoryCraft artifacts are stored under:

.sdlc/storycraft/

## Story Rules

When working with StoryCraft:

1. Use the HLD as the technical source of truth.
2. Use Problem Discovery and Solution Discovery context.
3. Do not invent requirements.
4. Do not invent architecture components.
5. Every story must belong to an Epic.
6. Dependencies must reference existing stories.
7. Acceptance criteria must be testable.
8. Technical requirements must be implementation relevant.
9. HLD references must be included.
10. Story points must be between 1 and 13.

## Human Review

Human approval is required before stories are considered ready for Jira.

Do not create Jira work items without explicit developer approval.

## Developer Control

The developer decides when StoryCraft actions are executed.

Do not silently modify project requirements or create Jira work items.
`;
}

function createStoryCraftPrompt(): string {
    return `# StoryCraft

Use this prompt when working with the StoryCraft workflow.

## Objective

Generate or review Epics and Stories using:

1. Problem Discovery
2. Solution Discovery
3. High-Level Design
4. Existing project context

## Required Process

Follow this order:

Problem Context
→ Solution Context
→ HLD
→ Epic Design
→ Story Design
→ Validation
→ Human Review
→ Jira

## Rules

- Do not invent requirements.
- Do not invent architecture.
- Do not ignore HLD references.
- Do not create stories unrelated to the supplied context.
- Keep stories independently implementable where possible.
- Identify dependencies explicitly.
- Acceptance criteria must be testable.
- Technical requirements must be clear.
- Story points must be reasonable.
- Human approval is required before Jira creation.

## Output

When generating stories, use the StoryCraft JSON structure expected by:

.sdlc/storycraft/stories.json

Do not create Jira issues unless the developer explicitly approves the generated stories.
`;
}