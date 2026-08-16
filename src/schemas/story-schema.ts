export interface StoryEpic {
    id: string;
    title: string;
    description: string;
    businessValue: string;
}

export interface Story {
    id: string;
    epicId: string;

    title: string;
    description: string;
    businessValue: string;

    acceptanceCriteria: string[];

    technicalRequirements: string[];

    dependencies: string[];

    hldReferences: string[];

    estimate: {
        storyPoints: number;
    };
}

export interface StoryDocument {
    version: string;
    generatedBy: string;

    epics: StoryEpic[];

    stories: Story[];
}