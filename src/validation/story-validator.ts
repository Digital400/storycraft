import { Story } from "../schemas/story.js";
import { STORYCRAFT_RULES } from "../rules/storycraft-rules.js";

export interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

export function validateStory(
  story: Story
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // ----------------------------------------
  // Basic story validation
  // ----------------------------------------

  if (!story) {
    return {
      passed: false,
      errors: ["Story is required."],
      warnings: []
    };
  }

  // ----------------------------------------
  // Story ID
  // ----------------------------------------

  if (!story.id?.trim()) {
    errors.push("Story ID is required.");
  }

  // ----------------------------------------
  // Epic
  // ----------------------------------------

  if (
    STORYCRAFT_RULES.structure.epicRequired &&
    !story.epicId?.trim()
  ) {
    errors.push("Epic ID is required.");
  }

  // ----------------------------------------
  // Title
  // ----------------------------------------

  if (
    STORYCRAFT_RULES.story.titleRequired &&
    !story.title?.trim()
  ) {
    errors.push("Story title is required.");
  }

  // ----------------------------------------
  // Description
  // ----------------------------------------

  if (
    STORYCRAFT_RULES.story.descriptionRequired &&
    !story.description?.trim()
  ) {
    errors.push("Story description is required.");
  }

  // ----------------------------------------
  // Business Value
  // ----------------------------------------

  if (
    STORYCRAFT_RULES.story.businessValueRequired &&
    !story.businessValue?.trim()
  ) {
    errors.push("Business value is required.");
  }

  // ----------------------------------------
  // Acceptance Criteria
  // ----------------------------------------

  if (
    !Array.isArray(story.acceptanceCriteria)
  ) {
    errors.push(
      "Acceptance criteria must be an array."
    );
  } else if (
    STORYCRAFT_RULES.story.acceptanceCriteriaRequired &&
    story.acceptanceCriteria.length <
    STORYCRAFT_RULES.quality.minimumAcceptanceCriteria
  ) {
    errors.push(
      `At least ${STORYCRAFT_RULES.quality.minimumAcceptanceCriteria} acceptance criterion is required.`
    );
  }

  // ----------------------------------------
  // Technical Requirements
  // ----------------------------------------

  if (
    !Array.isArray(story.technicalRequirements)
  ) {
    errors.push(
      "Technical requirements must be an array."
    );
  } else if (
    STORYCRAFT_RULES.story.technicalRequirementsRequired &&
    story.technicalRequirements.length <
    STORYCRAFT_RULES.quality.minimumTechnicalRequirements
  ) {
    errors.push(
      `At least ${STORYCRAFT_RULES.quality.minimumTechnicalRequirements} technical requirement is required.`
    );
  }

  // ----------------------------------------
  // HLD References
  // ----------------------------------------

  if (
    !Array.isArray(story.hldReferences)
  ) {
    errors.push(
      "HLD references must be an array."
    );
  } else if (
    STORYCRAFT_RULES.story.hldReferenceRequired &&
    story.hldReferences.length === 0
  ) {
    errors.push(
      "At least one HLD reference is required."
    );
  }

  // ----------------------------------------
  // Dependencies
  // ----------------------------------------

  if (!Array.isArray(story.dependencies)) {
    errors.push(
      "Dependencies must be an array."
    );
  }

  // ----------------------------------------
  // Estimate
  // ----------------------------------------

  if (
    STORYCRAFT_RULES.story.estimateRequired &&
    !story.estimate
  ) {
    errors.push(
      "Story estimate is required."
    );
  } else if (story.estimate) {
    const storyPoints =
      story.estimate.storyPoints;

    if (
      typeof storyPoints !== "number" ||
      !Number.isFinite(storyPoints)
    ) {
      errors.push(
        "Story points must be a valid number."
      );
    } else {
      if (
        storyPoints <
        STORYCRAFT_RULES.quality.minimumStoryPoints
      ) {
        errors.push(
          `Story points must be greater than or equal to ${STORYCRAFT_RULES.quality.minimumStoryPoints}.`
        );
      }

      if (
        storyPoints >
        STORYCRAFT_RULES.quality.maximumStoryPoints
      ) {
        errors.push(
          `Story points cannot exceed ${STORYCRAFT_RULES.quality.maximumStoryPoints}.`
        );
      }
    }
  }

  // ----------------------------------------
  // Warnings
  // ----------------------------------------

  if (
    Array.isArray(story.acceptanceCriteria) &&
    story.acceptanceCriteria.length === 1
  ) {
    warnings.push(
      "Story contains only one acceptance criterion."
    );
  }

  if (
    Array.isArray(story.technicalRequirements) &&
    story.technicalRequirements.length === 1
  ) {
    warnings.push(
      "Story contains only one technical requirement."
    );
  }

  if (
    Array.isArray(story.dependencies) &&
    story.dependencies.length === 0
  ) {
    warnings.push(
      "Story has no dependencies."
    );
  }

  if (
    Array.isArray(story.hldReferences) &&
    story.hldReferences.length === 0
  ) {
    warnings.push(
      "Story has no HLD references."
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