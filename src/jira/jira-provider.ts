export interface JiraProject {
    key: string;
    name: string;
}

export interface JiraEpic {
    id: string;
    key: string;
    title: string;
}

export interface JiraStory {
    id: string;
    key: string;
    title: string;
}

export interface JiraProvider {
    name: string;

    listProjects(): Promise<JiraProject[]>;

    createProject(
        key: string,
        name: string
    ): Promise<JiraProject>;

    createEpic(
        projectKey: string,
        title: string,
        description: string
    ): Promise<JiraEpic>;

    createStory(
        projectKey: string,
        epicKey: string,
        title: string,
        description: string
    ): Promise<JiraStory>;
}