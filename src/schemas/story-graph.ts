export interface StoryDependency {
    from: string;
    to: string;
    type: "depends_on" | "blocks";
}

export interface StoryGraph {
    nodes: string[];
    dependencies: StoryDependency[];
}