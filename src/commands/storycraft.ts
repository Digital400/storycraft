import fs from "node:fs";
import path from "node:path";
import { input, confirm } from "@inquirer/prompts";

import { validateStoryDocument } from "../validation/story-document-validator.js";
import { validateContext } from "../validation/context-validator.js";
import { loadContext } from "../context/context-loader.js";
import { createAIProvider } from "../ai/ai-provider-factory.js";
import { loadConfig } from "../config.js";
import { buildStoryGraph } from "../core/story-graph.js";
import { createHLDProvider } from "../resources/hld-provider-factory.js";
import { installStoryCraft } from "./storycraft-install.js";
import { runJiraWorkflow } from "./jira-workflow.js";
import { validateReview } from "../validation/review-validator.js";

export async function initStoryCraft(): Promise<void> {
  const projectRoot = process.cwd();
  const sdlcPath = path.join(projectRoot, ".sdlc");

  const directories = [
    sdlcPath,
    path.join(sdlcPath, "context"),
    path.join(sdlcPath, "storycraft")
  ];

  for (const directory of directories) {
    fs.mkdirSync(directory, { recursive: true });
  }

  const configPath = path.join(
    sdlcPath,
    "config.yaml"
  );

  if (fs.existsSync(configPath)) {
    console.log("");
    console.log(
      "StoryCraft is already initialized in this project."
    );
    console.log(
      "Existing config.yaml was not changed."
    );
    return;
  }

  const projectName = await input({
    message: "Project name:",
    validate: (value) => {
      if (!value.trim()) {
        return "Project name is required.";
      }

      return true;
    }
  });

  const config = `project:
  name: "${projectName.trim()}"

jira:
  enabled: true
  project_key: ""

confluence:
  enabled: true
  space_key: ""

ai:
  provider: "claude"
  mode: "vscode"

resources:
  hld:
    provider: "confluence"

storycraft:
  require_human_review: true
`;

  fs.writeFileSync(
    configPath,
    config,
    "utf8"
  );

  createContextFile(
    sdlcPath,
    "problem.json",
    createProblemTemplate(
      projectName.trim()
    )
  );

  createContextFile(
    sdlcPath,
    "solution.json",
    createSolutionTemplate(
      projectName.trim()
    )
  );

  createContextFile(
    sdlcPath,
    "hld.json",
    createHldTemplate(
      projectName.trim()
    )
  );

  console.log("");
  console.log(
    "StoryCraft project initialized!"
  );
  console.log("");

  console.log(".sdlc/");
  console.log("├── config.yaml");
  console.log("├── context/");
  console.log("│   ├── problem.json");
  console.log("│   ├── solution.json");
  console.log("│   └── hld.json");
  console.log("└── storycraft/");
  console.log("");
}

function createContextFile(
  sdlcPath: string,
  fileName: string,
  content: string
): void {
  const filePath = path.join(
    sdlcPath,
    "context",
    fileName
  );

  fs.writeFileSync(
    filePath,
    content,
    "utf8"
  );
}

function createProblemTemplate(
  projectName: string
): string {
  return JSON.stringify(
    {
      version: "1.0",
      project: projectName,
      status: "not_available",
      problem: {
        statement: "",
        businessImpact: "",
        stakeholders: [],
        successMetrics: []
      }
    },
    null,
    2
  );
}

function createSolutionTemplate(
  projectName: string
): string {
  return JSON.stringify(
    {
      version: "1.0",
      project: projectName,
      status: "not_available",
      solution: {
        description: "",
        objectives: [],
        features: [],
        assumptions: [],
        risks: []
      }
    },
    null,
    2
  );
}

function createHldTemplate(
  projectName: string
): string {
  return JSON.stringify(
    {
      version: "1.0",
      project: projectName,
      status: "not_available",
      hld: {
        description: "",
        components: [],
        integrations: [],
        dataSources: [],
        securityRequirements: [],
        nonFunctionalRequirements: []
      }
    },
    null,
    2
  );
}

export function createStoriesFile(): void {
  const storiesPath = path.join(
    process.cwd(),
    ".sdlc",
    "storycraft",
    "stories.json"
  );

  if (fs.existsSync(storiesPath)) {
    console.log("");
    console.log(
      "stories.json already exists."
    );
    return;
  }

  const content = JSON.stringify(
    {
      version: "1.0",
      generatedBy: "manual",
      epics: [],
      stories: []
    },
    null,
    2
  );

  fs.writeFileSync(
    storiesPath,
    content,
    "utf8"
  );

  console.log("");
  console.log(
    "Story file created:"
  );
  console.log(
    ".sdlc/storycraft/stories.json"
  );
  console.log("");
}

export function validateStoriesFile(): void {
  const storiesPath = path.join(
    process.cwd(),
    ".sdlc",
    "storycraft",
    "stories.json"
  );

  if (!fs.existsSync(storiesPath)) {
    console.log("");
    console.log(
      "stories.json not found."
    );
    console.log(
      "Run: sdlc storycraft create"
    );
    console.log("");
    return;
  }

  try {
    const fileContent =
      fs.readFileSync(
        storiesPath,
        "utf8"
      );

    const document =
      JSON.parse(fileContent);

    const result =
      validateStoryDocument(document);

    console.log("");
    console.log(
      "StoryCraft Document Validator"
    );
    console.log(
      "============================="
    );
    console.log("");

    if (result.errors.length > 0) {
      console.log("Errors:");

      for (const error of result.errors) {
        console.log(
          `  ✗ ${error}`
        );
      }

      console.log("");
    }

    if (result.warnings.length > 0) {
      console.log("Warnings:");

      for (const warning of result.warnings) {
        console.log(
          `  ⚠ ${warning}`
        );
      }

      console.log("");
    }

    if (result.passed) {
      console.log(
        "✓ Story document validation PASSED."
      );
    } else {
      console.log(
        "✗ Story document validation FAILED."
      );
    }

    console.log("");

    if (!result.passed) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.log("");
    console.log(
      "✗ Unable to validate stories.json."
    );

    if (error instanceof Error) {
      console.log(
        `  ${error.message}`
      );
    }

    console.log("");

    process.exitCode = 1;
  }
}

export async function generateStories(): Promise<void> {
  console.log("");
  console.log(
    "StoryCraft Story Generator"
  );
  console.log(
    "--------------------------"
  );

  try {
    const config = loadConfig();

    const context = loadContext();

    const provider = createAIProvider(
      config.ai.provider,
      config.ai.mode
    );

    const hldProvider =
      createHLDProvider(
        config.resources.hld.provider
      );

    const hld =
      await hldProvider.load();

    console.log(
      `AI Provider: ${provider.name}`
    );

    console.log(
      `AI Mode: ${config.ai.mode}`
    );

    console.log(
      `HLD Provider: ${hldProvider.name}`
    );

    console.log("");

    console.log(
      "Generating stories..."
    );

    const generationResult =
      await provider.generateStories({
        context,
        hld
      });

    const stories =
      generationResult.stories;

    const epics =
      generationResult.epics;

    const storiesPath = path.join(
      process.cwd(),
      ".sdlc",
      "storycraft",
      "stories.json"
    );

    const output = {
      version: "1.0",
      generatedBy: provider.name,
      epics,
      stories
    };

    fs.writeFileSync(
      storiesPath,
      JSON.stringify(
        output,
        null,
        2
      ),
      "utf8"
    );

    console.log("");

    console.log(
      `Generated ${epics.length} epic(s).`
    );

    console.log(
      `Generated ${stories.length} story(s).`
    );

    console.log("");

    console.log(
      "Output: .sdlc/storycraft/stories.json"
    );

    console.log("");
  } catch (error) {
    console.error("");

    if (error instanceof Error) {
      console.error(
        error.message
      );
    } else {
      console.error(
        "Story generation failed."
      );
    }

    console.error("");

    process.exitCode = 1;
  }
}

export async function runStoryCraft(): Promise<void> {
  console.log("");
  console.log(
    "StoryCraft Workflow"
  );
  console.log(
    "==================="
  );
  console.log("");

  try {
    // ----------------------------------------
    // Step 1: Load context
    // ----------------------------------------

    console.log(
      "1. Loading context..."
    );

    const context =
      loadContext();

    console.log(
      "   ✓ Context loaded"
    );
    console.log("");

    // ----------------------------------------
    // Step 2: Validate context
    // ----------------------------------------

    console.log(
      "2. Validating context..."
    );

    const contextResult =
      validateContext(context);

    if (!contextResult.passed) {
      console.log(
        "   ✗ Context validation failed"
      );

      console.log("");

      for (
        const error
        of contextResult.errors
      ) {
        console.log(
          `   - ${error}`
        );
      }

      console.log("");
      console.log(
        "Workflow stopped."
      );
      console.log("");

      return;
    }

    console.log(
      "   ✓ Context validation passed"
    );
    console.log("");

    // ----------------------------------------
    // Step 3: Load configuration
    // ----------------------------------------

    console.log(
      "3. Loading configuration..."
    );

    const config =
      loadConfig();

    console.log(
      `   ✓ AI Provider: ${config.ai.provider}`
    );

    console.log("");

    // ----------------------------------------
    // Step 3.5: Load HLD
    // ----------------------------------------

    console.log(
      "3.5. Loading HLD..."
    );

    const hldProvider =
      createHLDProvider(
        config.resources.hld.provider
      );

    const hld =
      await hldProvider.load();

    console.log(
      `   ✓ HLD loaded from: ${hldProvider.name}`
    );

    console.log("");

    // ----------------------------------------
    // Step 4: Generate Epics + Stories
    // ----------------------------------------

    console.log(
      "4. Generating stories..."
    );

    const provider =
      createAIProvider(
        config.ai.provider,
        config.ai.mode
      );

    const generationResult =
      await provider.generateStories({
        context,
        hld
      });

    const stories =
      generationResult.stories;

    const epics =
      generationResult.epics;

    console.log(
      `   ✓ Generated ${epics.length} epic(s)`
    );

    console.log(
      `   ✓ Generated ${stories.length} story(s)`
    );

    console.log("");

    // ----------------------------------------
    // Step 5: Validate document
    // ----------------------------------------

    console.log(
      "5. Validating stories..."
    );

    const validationDocument = {
      version: "1.0",
      generatedBy: provider.name,
      epics,
      stories
    };

    const validationResult =
      validateStoryDocument(
        validationDocument
      );

    if (!validationResult.passed) {
      console.log(
        "   ✗ Story document validation failed."
      );

      console.log("");

      for (
        const error
        of validationResult.errors
      ) {
        console.log(
          `   - ${error}`
        );
      }

      if (
        validationResult.warnings.length > 0
      ) {
        console.log("");
        console.log(
          "Warnings:"
        );

        for (
          const warning
          of validationResult.warnings
        ) {
          console.log(
            `   ⚠ ${warning}`
          );
        }
      }

      console.log("");
      console.log(
        "Workflow stopped."
      );
      console.log("");

      return;
    }

    console.log(
      "   ✓ Story document validation passed."
    );

    if (
      validationResult.warnings.length > 0
    ) {
      console.log("");

      for (
        const warning
        of validationResult.warnings
      ) {
        console.log(
          `   ⚠ ${warning}`
        );
      }
    }

    console.log("");

    // ----------------------------------------
    // Step 6: Save output
    // ----------------------------------------

    console.log(
      "6. Saving stories..."
    );

    const storiesPath = path.join(
      process.cwd(),
      ".sdlc",
      "storycraft",
      "stories.json"
    );

    const output = {
      version: "1.0",
      generatedBy: provider.name,
      epics,
      stories
    };

    fs.writeFileSync(
      storiesPath,
      JSON.stringify(
        output,
        null,
        2
      ),
      "utf8"
    );

    const graph =
      buildStoryGraph(stories);

    const graphPath = path.join(
      process.cwd(),
      ".sdlc",
      "storycraft",
      "story-graph.json"
    );

    fs.writeFileSync(
      graphPath,
      JSON.stringify(
        graph,
        null,
        2
      ),
      "utf8"
    );

    console.log(
      "   ✓ .sdlc/storycraft/story-graph.json"
    );

    console.log(
      "   ✓ .sdlc/storycraft/stories.json"
    );

    console.log("");

    console.log(
      "================================"
    );

    console.log(
      "StoryCraft workflow completed."
    );

    console.log(
      "Status: READY FOR REVIEW"
    );

    console.log(
      "================================"
    );

    console.log("");
  } catch (error) {
    console.error("");

    console.error(
      "StoryCraft workflow failed."
    );

    console.error("");

    if (error instanceof Error) {
      console.error(
        error.message
      );
    }

    console.error("");
  }
}

export async function runStoryCraftWorkflow(): Promise<void> {
  console.log("");
  console.log(
    "StoryCraft Developer Workflow"
  );
  console.log(
    "============================="
  );
  console.log("");

  await runStoryCraft();

  console.log("");
  console.log(
    "Starting human review..."
  );
  console.log("");

  await reviewStories();

  const review =
    validateReview();

  if (!review.approved) {
    console.log("");
    console.log(
      "Workflow stopped because stories were not approved."
    );
    console.log("");
    return;
  }

  await runJiraWorkflow();

  console.log("");
  console.log(
    "Developer workflow completed."
  );
  console.log("");
}

export async function reviewStories(): Promise<void> {
  const storiesPath = path.join(
    process.cwd(),
    ".sdlc",
    "storycraft",
    "stories.json"
  );

  if (!fs.existsSync(storiesPath)) {
    console.log("");
    console.log(
      "stories.json not found."
    );
    console.log(
      "Run: sdlc storycraft run"
    );
    console.log("");
    return;
  }

  const content =
    fs.readFileSync(
      storiesPath,
      "utf8"
    );

  const data =
    JSON.parse(content);

  if (
    !Array.isArray(data.stories) ||
    data.stories.length === 0
  ) {
    console.log("");
    console.log(
      "No stories available for review."
    );
    console.log("");
    return;
  }

  console.log("");
  console.log(
    "StoryCraft Human Review"
  );
  console.log(
    "======================="
  );
  console.log("");

  for (
    const story
    of data.stories
  ) {
    console.log(
      `ID: ${story.id}`
    );

    console.log(
      `Title: ${story.title}`
    );

    console.log(
      `Description: ${story.description}`
    );

    console.log(
      `Business Value: ${story.businessValue}`
    );

    console.log(
      `Story Points: ${story.estimate.storyPoints}`
    );

    console.log("");
    console.log(
      "Acceptance Criteria:"
    );

    for (
      const criterion
      of story.acceptanceCriteria
    ) {
      console.log(
        `  - ${criterion}`
      );
    }

    console.log("");
    console.log(
      "-----------------------"
    );
    console.log("");
  }

  const approved =
    await confirm({
      message:
        "Approve these stories?",
      default: false
    });

  const reviewPath = path.join(
    process.cwd(),
    ".sdlc",
    "storycraft",
    "review.json"
  );

  const review = {
    version: "1.0",
    status:
      approved
        ? "approved"
        : "rejected",
    reviewedAt:
      new Date().toISOString(),
    storiesFile:
      "stories.json"
  };

  fs.writeFileSync(
    reviewPath,
    JSON.stringify(
      review,
      null,
      2
    ),
    "utf8"
  );

  console.log("");

  if (approved) {
    console.log(
      "✓ Stories approved."
    );
  } else {
    console.log(
      "✗ Stories rejected."
    );
  }

  console.log("");
  console.log(
    "Review result saved to .sdlc/storycraft/review.json"
  );
  console.log("");
}