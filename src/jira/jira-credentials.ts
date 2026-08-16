export interface JiraCredentials {
    baseUrl: string;
    email: string;
    apiToken: string;
}

export function loadJiraCredentials(): JiraCredentials {
    const baseUrl = process.env.JIRA_BASE_URL;
    const email = process.env.JIRA_EMAIL;
    const apiToken = process.env.JIRA_API_TOKEN;

    if (!baseUrl) {
        throw new Error(
            "JIRA_BASE_URL environment variable is not configured."
        );
    }

    if (!email) {
        throw new Error(
            "JIRA_EMAIL environment variable is not configured."
        );
    }

    if (!apiToken) {
        throw new Error(
            "JIRA_API_TOKEN environment variable is not configured."
        );
    }

    return {
        baseUrl,
        email,
        apiToken
    };
}