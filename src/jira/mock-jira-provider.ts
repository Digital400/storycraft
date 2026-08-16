import {
    JiraProvider,
    JiraProject,
    JiraEpic,
    JiraStory
} from "./jira-provider.js";

export class MockJiraProvider implements JiraProvider {
    name = "mock";

    async listProjects(): Promise<JiraProject[]> {
        return [
            {
                key: "DEMO",
                name: "Demo Project"
            },
            {
                key: "OMS",
                name: "Order Management"
            }
        ];
    }

    async createProject(
        key: string,
        name: string
    ): Promise<JiraProject> {
        console.log("");
        console.log(
            `[Mock Jira] Creating project: ${key} - ${name}`
        );

        return {
            key,
            name
        };
    }

    async createEpic(
        projectKey: string,
        title: string,
        description: string
    ): Promise<JiraEpic> {
        console.log("");
        console.log(
            `[Mock Jira] Creating Epic in ${projectKey}: ${title}`
        );

        return {
            id: "10001",
            key: `${projectKey}-100`,
            title
        };
    }

    async createStory(
        projectKey: string,
        epicKey: string,
        title: string,
        description: string
    ): Promise<JiraStory> {
        console.log(
            `[Mock Jira] Creating Story in ${projectKey} under ${epicKey}: ${title}`
        );

        return {
            id: "20001",
            key: `${projectKey}-101`,
            title
        };
    }
}