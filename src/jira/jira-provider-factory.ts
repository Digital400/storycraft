import { JiraProvider } from "./jira-provider.js";
import { MockJiraProvider } from "./mock-jira-provider.js";
import { JiraCloudProvider } from "./jira-cloud-provider.js";

export function createJiraProvider(
    providerName: string
): JiraProvider {
    switch (providerName.toLowerCase()) {
        case "mock":
            return new MockJiraProvider();

        case "jira-cloud":
            return new JiraCloudProvider();

        default:
            throw new Error(
                `Unsupported Jira provider: ${providerName}`
            );
    }
}