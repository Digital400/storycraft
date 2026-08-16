import { Story } from "../schemas/story.js";
import {
    StoryGraph,
    StoryDependency
} from "../schemas/story-graph.js";

export function buildStoryGraph(
    stories: Story[]
): StoryGraph {
    const nodes = stories.map((story) => story.id);

    const dependencies: StoryDependency[] = [];

    for (const story of stories) {
        for (const dependency of story.dependencies) {
            dependencies.push({
                from: story.id,
                to: dependency,
                type: "depends_on"
            });
        }
    }

    return {
        nodes,
        dependencies
    };
}