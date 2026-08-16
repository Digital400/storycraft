import type { Epic } from "./epic.js";
import type { Story } from "./story.js";
import type { Task } from "./task.js";

export interface StoryCraftGenerationDocument {
  version: string;
  generatedBy: string;
  epics: Epic[];
  stories: Story[];
  tasks: Task[];
}
