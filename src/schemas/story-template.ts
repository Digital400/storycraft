import { Story } from "./story.js";

export function createStoryTemplate(): Story {
  return {
    id: "",
    epicId: "",
    title: "",
    description: "",
    businessValue: "",
    acceptanceCriteria: [],
    technicalRequirements: [],
    dependencies: [],
    hldReferences: [],
    estimate: {
      storyPoints: 0
    }
  };
}