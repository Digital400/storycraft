import { StoryDocument } from "../schemas/story-schema.js";
import { validateStory } from "./story-validator.js";
import { STORYCRAFT_RULES } from "../rules/storycraft-rules.js";

export interface StoryDocumentValidationResult {
    passed: boolean;
    errors: string[];
    warnings: string[];
}

export function validateStoryDocument(
    document: StoryDocument
): StoryDocumentValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // ----------------------------------------
    // Document validation
    // ----------------------------------------

    if (!document) {
        return {
            passed: false,
            errors: ["Story document is required."],
            warnings: []
        };
    }

    if (!document.version?.trim()) {
        errors.push("Story document version is required.");
    }

    if (!document.generatedBy?.trim()) {
        errors.push("Story document generatedBy is required.");
    }

    if (!Array.isArray(document.epics)) {
        errors.push("Epics must be an array.");
    }

    if (!Array.isArray(document.stories)) {
        errors.push("Stories must be an array.");
    }

    if (errors.length > 0) {
        return {
            passed: false,
            errors,
            warnings
        };
    }

    // ----------------------------------------
    // Epic validation
    // ----------------------------------------

    const epicIds = new Set<string>();

    for (const epic of document.epics) {
        if (!epic.id?.trim()) {
            errors.push("Epic ID is required.");
            continue;
        }

        if (
            STORYCRAFT_RULES.structure.uniqueEpicIdsRequired &&
            epicIds.has(epic.id)
        ) {
            errors.push(
                `Duplicate Epic ID found: ${epic.id}`
            );
        }

        epicIds.add(epic.id);

        if (!epic.title?.trim()) {
            errors.push(
                `${epic.id}: Epic title is required.`
            );
        }

        if (!epic.description?.trim()) {
            errors.push(
                `${epic.id}: Epic description is required.`
            );
        }

        if (!epic.businessValue?.trim()) {
            errors.push(
                `${epic.id}: Epic business value is required.`
            );
        }
    }

    // ----------------------------------------
    // Story ID validation
    // ----------------------------------------

    const storyIds = new Set<string>();

    for (const story of document.stories) {
        if (!story.id?.trim()) {
            errors.push(
                "Story ID is required."
            );

            continue;
        }

        if (
            STORYCRAFT_RULES.structure.uniqueStoryIdsRequired &&
            storyIds.has(story.id)
        ) {
            errors.push(
                `Duplicate Story ID found: ${story.id}`
            );
        }

        storyIds.add(story.id);
    }

    // ----------------------------------------
    // Story validation
    // ----------------------------------------

    for (const story of document.stories) {
        const result = validateStory(story);

        if (!result.passed) {
            for (const error of result.errors) {
                errors.push(
                    `${story.id || "UNKNOWN"}: ${error}`
                );
            }
        }

        for (const warning of result.warnings) {
            warnings.push(
                `${story.id || "UNKNOWN"}: ${warning}`
            );
        }
    }

    // ----------------------------------------
    // Epic reference validation
    // ----------------------------------------

    if (STORYCRAFT_RULES.structure.epicRequired) {
        for (const story of document.stories) {
            if (!story.epicId?.trim()) {
                continue;
            }

            if (!epicIds.has(story.epicId)) {
                errors.push(
                    `${story.id}: Epic '${story.epicId}' does not exist.`
                );
            }
        }
    }

    // ----------------------------------------
    // Dependency validation
    // ----------------------------------------

    if (
        STORYCRAFT_RULES.structure
            .dependencyValidationRequired
    ) {
        for (const story of document.stories) {
            if (!Array.isArray(story.dependencies)) {
                continue;
            }

            for (const dependency of story.dependencies) {
                if (!storyIds.has(dependency)) {
                    errors.push(
                        `${story.id}: Dependency '${dependency}' does not exist.`
                    );
                }

                if (dependency === story.id) {
                    errors.push(
                        `${story.id}: Story cannot depend on itself.`
                    );
                }
            }
        }
    }

    // ----------------------------------------
    // Empty document warnings
    // ----------------------------------------

    if (document.epics.length === 0) {
        warnings.push(
            "No Epics found in the story document."
        );
    }

    if (document.stories.length === 0) {
        warnings.push(
            "No Stories found in the story document."
        );
    }

    // ----------------------------------------
    // Final result
    // ----------------------------------------

    return {
        passed: errors.length === 0,
        errors,
        warnings
    };
}