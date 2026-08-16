import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

export type AIExecutionMode =
  | "direct"
  | "vscode";

export interface StoryCraftConfig {
  project: {
    name: string;
  };

  jira: {
    enabled: boolean;
    provider: string;
    base_url: string;
    project_key: string;
  };

  confluence: {
    enabled: boolean;
    space_key: string;
  };

  ai: {
    provider: string;
    mode: AIExecutionMode;
  };

  resources: {
    hld: {
      provider: string;
    };
  };

  storycraft: {
    require_human_review: boolean;
  };
}

export function loadConfig(): StoryCraftConfig {
  const configPath = path.join(
    process.cwd(),
    ".sdlc",
    "config.yaml"
  );

  if (!fs.existsSync(configPath)) {
    throw new Error(
      "StoryCraft configuration not found. Run 'sdlc storycraft init' first."
    );
  }

  const fileContent =
    fs.readFileSync(
      configPath,
      "utf8"
    );

  const config =
    YAML.parse(
      fileContent
    ) as StoryCraftConfig;

  if (!config.ai) {
    throw new Error(
      "AI configuration is missing."
    );
  }

  if (!config.ai.provider) {
    throw new Error(
      "AI provider is not configured."
    );
  }

  if (
    config.ai.mode !== "direct" &&
    config.ai.mode !== "vscode"
  ) {
    throw new Error(
      `Unsupported AI execution mode: ${config.ai.mode}`
    );
  }

  return config;
}

export function saveConfig(
  config: StoryCraftConfig
): void {
  const configPath = path.join(
    process.cwd(),
    ".sdlc",
    "config.yaml"
  );

  const yamlContent =
    YAML.stringify(config);

  fs.writeFileSync(
    configPath,
    yamlContent,
    "utf8"
  );
}