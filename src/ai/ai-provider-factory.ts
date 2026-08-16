import { AIProvider } from "./ai-provider.js";
import { MockAIProvider } from "./mock-ai-provider.js";
import { ClaudeAIProvider } from "./claude-ai-provider.js";
import { VSCodeAIProvider } from "./vscode-ai-provider.js";

export type AIExecutionMode =
  | "direct"
  | "vscode";

export function createAIProvider(
  providerName: string,
  mode: AIExecutionMode = "direct"
): AIProvider {
  const provider =
    providerName.toLowerCase().trim();

  if (mode === "vscode") {
    return new VSCodeAIProvider(providerName);
  }

  switch (provider) {
    case "mock":
      return new MockAIProvider();

    case "claude":
      return new ClaudeAIProvider();

    default:
      throw new Error(
        `Unsupported direct AI provider: ${providerName}`
      );
  }
}