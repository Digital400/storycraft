import { AIProvider } from "./ai-provider.js";
import { MockAIProvider } from "./mock-ai-provider.js";
import { ClaudeAIProvider } from "./claude-ai-provider.js";

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
    /*
     * VS Code mode does not call an AI API directly.
     *
     * GitHub Copilot / Claude inside VS Code
     * is responsible for executing the AI task.
     *
     * StoryCraft therefore uses the Claude
     * provider only for direct API execution.
     */
    throw new Error(
      [
        "VS Code AI mode does not use an API provider directly.",
        "",
        "Use the StoryCraft VS Code workflow:",
        "sdlc storycraft start"
      ].join("\n")
    );
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