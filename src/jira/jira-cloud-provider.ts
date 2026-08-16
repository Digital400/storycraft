import {
    JiraProvider,
    JiraProject,
    JiraEpic,
    JiraStory
} from "./jira-provider.js";

import { loadJiraCredentials } from "./jira-credentials.js";

export class JiraCloudProvider implements JiraProvider {
    name = "jira-cloud";

    private credentials = loadJiraCredentials();

    private get headers(): Record<string, string> {
        const token = Buffer.from(
            `${this.credentials.email}:${this.credentials.apiToken}`
        ).toString("base64");

        return {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Basic ${token}`
        };
    }

    private get baseUrl(): string {
        return this.credentials.baseUrl.replace(/\/+$/, "");
    }

    async listProjects(): Promise<JiraProject[]> {
        const response = await fetch(
            `${this.baseUrl}/rest/api/3/project/search?startAt=0&maxResults=100`,
            {
                method: "GET",
                headers: this.headers
            }
        );

        if (!response.ok) {
            const body = await response.text();

            throw new Error(
                `Jira project request failed (${response.status}): ${body}`
            );
        }

        const data = await response.json();

        return (data.values ?? []).map(
            (project: {
                key: string;
                name: string;
            }) => ({
                key: project.key,
                name: project.name
            })
        );
    }

    async createProject(
        key: string,
        name: string
    ): Promise<JiraProject> {
        const response = await fetch(
            `${this.baseUrl}/rest/api/3/project`,
            {
                method: "POST",
                headers: this.headers,
                body: JSON.stringify({
                    key,
                    name,
                    projectTypeKey: "software",
                    projectTemplateKey:
                        "com.atlassian.jira-core-project-templates:jira-core-simplified-process-control"
                })
            }
        );

        if (!response.ok) {
            const body = await response.text();

            throw new Error(
                `Jira project creation failed (${response.status}): ${body}`
            );
        }

        const data = await response.json();

        return {
            key: data.key,
            name
        };
    }

    async createEpic(
        projectKey: string,
        title: string,
        description: string
    ): Promise<JiraEpic> {
        throw new Error(
            "Real Jira Epic creation is not implemented yet."
        );
    }

    async createStory(
        projectKey: string,
        epicKey: string,
        title: string,
        description: string
    ): Promise<JiraStory> {
        throw new Error(
            "Real Jira Story creation is not implemented yet."
        );
    }
}