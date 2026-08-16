import {
    JiraProvider,
    JiraProject,
    JiraEpic,
    JiraStory,
    JiraTask
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
        return this.createIssueWithFallback<JiraEpic>(
            ["Epic"],
            projectKey,
            title,
            description,
            undefined,
            (created) => ({
                id: created.id,
                key: created.key,
                title
            })
        );
    }

    async createStory(
        projectKey: string,
        epicKey: string,
        title: string,
        description: string
    ): Promise<JiraStory> {
        return this.createIssueWithFallback<JiraStory>(
            ["Story", "User Story"],
            projectKey,
            title,
            description,
            epicKey,
            (created) => ({
                id: created.id,
                key: created.key,
                title
            })
        );
    }

    async createTask(
        projectKey: string,
        storyKey: string,
        title: string,
        description: string
    ): Promise<JiraTask> {
        return this.createIssueWithFallback<JiraTask>(
            ["Task"],
            projectKey,
            title,
            description,
            storyKey,
            (created) => ({
                id: created.id,
                key: created.key,
                title
            })
        );
    }

    private async createIssueWithFallback<T>(
        issueTypeNames: string[],
        projectKey: string,
        title: string,
        description: string,
        parentKey: string | undefined,
        map: (created: { id: string; key: string }) => T
    ): Promise<T> {
        const failures: string[] = [];

        for (const issueTypeName of issueTypeNames) {
            try {
                const created = await this.createIssue(
                    issueTypeName,
                    projectKey,
                    title,
                    description,
                    parentKey
                );

                return map(created);
            } catch (error) {
                failures.push(
                    `${issueTypeName}: ${error instanceof Error ? error.message : String(error)}`
                );
            }
        }

        throw new Error(
            `Jira issue creation failed. Tried ${issueTypeNames.join(", ")}. ${failures.join(" | ")}`
        );
    }

    private async createIssue(
        issueTypeName: string,
        projectKey: string,
        title: string,
        description: string,
        parentKey: string | undefined
    ): Promise<{ id: string; key: string }> {
        const body: {
            fields: {
                project: { key: string };
                summary: string;
                description: {
                    type: "doc";
                    version: 1;
                    content: Array<{
                        type: "paragraph";
                        content: Array<{
                            type: "text";
                            text: string;
                        }>;
                    }>;
                };
                issuetype: { name: string };
                parent?: { key: string };
            };
        } = {
            fields: {
                project: {
                    key: projectKey
                },
                summary: title,
                description: {
                    type: "doc",
                    version: 1,
                    content: [
                        {
                            type: "paragraph",
                            content: [
                                {
                                    type: "text",
                                    text: description
                                }
                            ]
                        }
                    ]
                },
                issuetype: {
                    name: issueTypeName
                }
            }
        };

        if (parentKey) {
            body.fields.parent = {
                key: parentKey
            };
        }

        const response = await fetch(
            `${this.baseUrl}/rest/api/3/issue`,
            {
                method: "POST",
                headers: this.headers,
                body: JSON.stringify(body)
            }
        );

        if (!response.ok) {
            const errorBody = await response.text();

            throw new Error(
                `Jira issue request failed (${response.status}): ${errorBody}`
            );
        }

        const data = await response.json() as {
            id?: string;
            key?: string;
        };

        if (!data.id || !data.key) {
            throw new Error(
                "Jira issue response is missing id/key."
            );
        }

        return {
            id: data.id,
            key: data.key
        };
    }
}