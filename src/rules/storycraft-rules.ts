export const STORYCRAFT_RULES = {
  story: {
    titleRequired: true,
    descriptionRequired: true,
    businessValueRequired: true,
    acceptanceCriteriaRequired: true,
    technicalRequirementsRequired: true,
    hldReferenceRequired: true,
    estimateRequired: true
  },

  quality: {
    minimumAcceptanceCriteria: 1,
    minimumTechnicalRequirements: 1,
    minimumStoryPoints: 1,
    maximumStoryPoints: 13
  },

  structure: {
    epicRequired: true,
    dependencyValidationRequired: true,
    uniqueStoryIdsRequired: true,
    uniqueEpicIdsRequired: true
  },

  governance: {
    humanReviewRequired: true,
    jiraCreationRequiresApproval: true
  }
};