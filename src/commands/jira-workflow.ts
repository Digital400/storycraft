import fs from "node:fs";
import path from "node:path";
import { confirm } from "@inquirer/prompts";

import { loadConfig } from "../config.js";
import { validateReview } from "../validation/review-validator.js";
import { createJiraProvider } from "../jira/jira-provider-factory.js";

export async function runJiraWorkflow(): Promise<void> {
    const review = validateReview();

    if (!review.approved) {
        console.log("");
        console.log("✗ Jira creation blocked.");
        console.log(review.message);
        console.log("");
        return;
    }

    const config = loadConfig();

    if (!config.jira.enabled) {
        console.log("");
        console.log("Jira integration is disabled.");
        console.log("");
        return;
    }

    if (!config.jira.project_key) {
        console.log("");
        console.log("No Jira project has been configured.");
        console.log("Run: sdlc storycraft jira-setup");
        console.log("");
        return;
    }

    const approved = await confirm({
        message:
            `Create approved stories in Jira project ${config.jira.project_key}?`,
        default: false
    });

    if (!approved) {
        console.log("");
        console.log("Jira creation cancelled.");
        console.log("");
        return;
    }

    const storiesPath = path.join(
        process.cwd(),
        ".sdlc",
        "storycraft",
        "stories.json"
    );

    if (!fs.existsSync(storiesPath)) {
        throw new Error(
            "stories.json not found. Run 'sdlc storycraft run' first."
        );
    }

    const resultPath = path.join(
        process.cwd(),
        ".sdlc",
        "storycraft",
        "jira-result.json"
    );

    if (fs.existsSync(resultPath)) {
        console.log("");
        console.log(
            "Jira creation has already been performed."
        );
        console.log(
            "Result: .sdlc/storycraft/jira-result.json"
        );
        console.log("");
        return;
    }

    const storiesData = JSON.parse(
        fs.readFileSync(
            storiesPath,
            "utf8"
        )
    );

    const jira = createJiraProvider(
        config.jira.provider
    );

    const projectKey =
        config.jira.project_key;

    const jiraResult = {
        version: "1.0",
        projectKey,

        createdAt:
            new Date().toISOString(),

        epics: [] as Array<{
            storyCraftEpicId: string;
            jiraEpicKey: string;
        }>,

        stories: [] as Array<{
            storyCraftStoryId: string;
            jiraStoryKey: string;
        }>
    };

    console.log("");
    console.log("Creating Jira items...");
    console.log("");

    const epics =
        storiesData.epics ?? [];

    const stories =
        storiesData.stories ?? [];

    for (const epic of epics) {
        const createdEpic =
            await jira.createEpic(
                projectKey,
                epic.title,
                epic.description
            );

        console.log(
            `✓ Epic created: ${createdEpic.key}`
        );

        jiraResult.epics.push({
            storyCraftEpicId:
                epic.id,

            jiraEpicKey:
                createdEpic.key
        });

        const epicStories =
            stories.filter(
                (story: {
                    epicId: string;
                }) =>
                    story.epicId ===
                    epic.id
            );

        for (
            const story
            of epicStories
        ) {
            const jiraDescription =
                buildJiraStoryDescription(
                    story
                );

            const createdStory =
                await jira.createStory(
                    projectKey,
                    createdEpic.key,
                    story.title,
                    jiraDescription
                );

            console.log(
                `  ✓ Story created: ${createdStory.key}`
            );

            jiraResult.stories.push({
                storyCraftStoryId:
                    story.id,

                jiraStoryKey:
                    createdStory.key
            });
        }
    }

    fs.writeFileSync(
        resultPath,
        JSON.stringify(
            jiraResult,
            null,
            2
        ),
        "utf8"
    );

    console.log("");
    console.log(
        "✓ Jira creation completed."
    );
    console.log(
        "✓ StoryCraft ↔ Jira mapping saved."
    );
    console.log(
        "✓ .sdlc/storycraft/jira-result.json"
    );
    console.log("");
}

function buildJiraStoryDescription(
    story: {
        id: string;
        description: string;
        businessValue: string;
        acceptanceCriteria: string[];
        technicalRequirements: string[];
        dependencies: string[];
        hldReferences: string[];
        estimate: {
            storyPoints: number;
        };
    }
): string {
    const acceptanceCriteria =
        story.acceptanceCriteria
            .map(
                (criterion) =>
                    `- ${criterion}`
            )
            .join("\n");

    const technicalRequirements =
        story.technicalRequirements
            .map(
                (requirement) =>
                    `- ${requirement}`
            )
            .join("\n");

    const dependencies =
        story.dependencies.length > 0
            ? story.dependencies
                .map(
                    (dependency) =>
                        `- ${dependency}`
                )
                .join("\n")
            : "- None";

    const hldReferences =
        story.hldReferences.length > 0
            ? story.hldReferences
                .map(
                    (reference) =>
                        `- ${reference}`
                )
                .join("\n")
            : "- None";

    return `h2. StoryCraft

*StoryCraft ID:* ${story.id}

h2. Description

${story.description}

h2. Business Value

${story.businessValue}

h2. Acceptance Criteria

${acceptanceCriteria}

h2. Technical Requirements

${technicalRequirements}

h2. Dependencies

${dependencies}

h2. HLD References

${hldReferences}

h2. Estimate

*Story Points:* ${story.estimate.storyPoints}
`;
}