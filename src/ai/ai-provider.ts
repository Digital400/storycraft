import { StoryCraftContext } from "../context/context-loader.js";
import { Story } from "../schemas/story.js";
import { Epic } from "../schemas/epic.js";
import { Task } from "../schemas/task.js";

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
  tasks: Task[];
}

export interface AIProvider {
  name: string;

  generateStories(
    request: StoryGenerationRequest
  ): Promise<StoryGenerationResult>;
}