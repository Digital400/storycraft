import { StoryCraftGenerationDocument } from "../schemas/storycraft-generation.js";
import { validateStory } from "./story-validator.js";
import { STORYCRAFT_RULES } from "../rules/storycraft-rules.js";
import { Task } from "../schemas/task.js";

export interface StoryDocumentValidationResult {
    passed: boolean;
    errors: string[];
    warnings: string[];
}

export function validateStoryDocument(
    document: StoryCraftGenerationDocument
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

    if (!Array.isArray(document.tasks)) {
        errors.push("Tasks must be an array.");
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
    const epicTitles = new Set<string>();

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
        } else {
            const normalizedTitle = epic.title.trim().toLowerCase();

            if (epicTitles.has(normalizedTitle)) {
                errors.push(
                    `Duplicate Epic title found: ${epic.title}`
                );
            }

            epicTitles.add(normalizedTitle);
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
    const storyTitles = new Set<string>();

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

        if (typeof story.title === "string") {
            const normalizedTitle = story.title.trim().toLowerCase();

            if (normalizedTitle) {
                if (storyTitles.has(normalizedTitle)) {
                    errors.push(
                        `Duplicate Story title found: ${story.title}`
                    );
                }

                storyTitles.add(normalizedTitle);
            }
        }
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
        errors.push(
            "At least one Epic is required."
        );
    }

    if (document.stories.length === 0) {
        errors.push(
            "At least one Story is required."
        );
    }

    if (document.tasks.length === 0) {
        errors.push(
            "At least one Task is required."
        );
    }

    validateTasks(
        document.tasks,
        storyIds,
        errors,
        warnings
    );

    // ----------------------------------------
    // Final result
    // ----------------------------------------

    return {
        passed: errors.length === 0,
        errors,
        warnings
    };
}

function validateTasks(
    tasks: Task[],
    storyIds: Set<string>,
    errors: string[],
    warnings: string[]
): void {
    const taskIds = new Set<string>();
    const taskTitles = new Set<string>();

    for (const task of tasks) {
        if (!task.id?.trim()) {
            errors.push("Task ID is required.");
            continue;
        }

        if (taskIds.has(task.id)) {
            errors.push(
                `Duplicate Task ID found: ${task.id}`
            );
        }

        taskIds.add(task.id);

        if (!task.storyId?.trim()) {
            errors.push(
                `${task.id}: Story ID is required.`
            );
        } else if (!storyIds.has(task.storyId)) {
            errors.push(
                `${task.id}: Story '${task.storyId}' does not exist.`
            );
        }

        if (!task.title?.trim()) {
            errors.push(
                `${task.id}: Task title is required.`
            );
        } else {
            const normalizedTitle = task.title.trim().toLowerCase();

            if (taskTitles.has(normalizedTitle)) {
                errors.push(
                    `Duplicate Task title found: ${task.title}`
                );
            }

            taskTitles.add(normalizedTitle);
        }

        if (!task.description?.trim()) {
            errors.push(
                `${task.id}: Task description is required.`
            );
        }

        if (!Array.isArray(task.technicalDetails) || task.technicalDetails.length === 0) {
            errors.push(
                `${task.id}: Task technical details are required.`
            );
        }

        if (!Array.isArray(task.dependencies)) {
            errors.push(
                `${task.id}: Task dependencies must be an array.`
            );
        }

        if (
            !task.estimate ||
            typeof task.estimate.hours !== "number" ||
            !Number.isFinite(task.estimate.hours) ||
            task.estimate.hours <= 0
        ) {
            errors.push(
                `${task.id}: Task estimate.hours must be a positive number.`
            );
        }
    }

    for (const task of tasks) {
        if (!Array.isArray(task.dependencies)) {
            continue;
        }

        for (const dependency of task.dependencies) {
            if (!taskIds.has(dependency)) {
                errors.push(
                    `${task.id}: Task dependency '${dependency}' does not exist.`
                );
            }

            if (dependency === task.id) {
                errors.push(
                    `${task.id}: Task cannot depend on itself.`
                );
            }
        }
    }
}