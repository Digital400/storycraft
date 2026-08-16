import { StoryCraftContext } from "../context/context-loader.js";
import { Story } from "../schemas/story.js";
import { Epic } from "../schemas/epic.js";

export interface StoryGenerationRequest {
  context: StoryCraftContext;

  hld: {
    source: string;
    content: string;
  };
}

export interface StoryGenerationResult {
  epics: Epic[];
  stories: Story[];
}

export interface AIProvider {
  name: string;

  generateStories(
    request: StoryGenerationRequest
  ): Promise<StoryGenerationResult>;
}