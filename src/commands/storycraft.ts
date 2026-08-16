import fs from "node:fs";
import path from "node:path";

import {
  input,
  confirm,
  select
} from "@inquirer/prompts";

import {
  validateStoryDocument
} from "../validation/story-document-validator.js";

import {
  validateContext
} from "../validation/context-validator.js";

import {
  loadContext
} from "../context/context-loader.js";

import {
  createAIProvider
} from "../ai/ai-provider-factory.js";

import {
  loadConfig,
  saveConfig
} from "../config.js";

import {
  buildStoryGraph
} from "../core/story-graph.js";

import {
  createHLDProvider
} from "../resources/hld-provider-factory.js";

import {
  runJiraWorkflow
} from "./jira-workflow.js";

import {
  validateReview
} from "../validation/review-validator.js";

import type {
  StoryGenerationResult
} from "../ai/ai-provider.js";

import type {
  Epic
} from "../schemas/epic.js";

import type {
  Story
} from "../schemas/story.js";


// ==================================================
// INIT
// ==================================================

export async function initStoryCraft():
  Promise<void> {

  const projectRoot =
    process.cwd();

  const sdlcPath =
    path.join(
      projectRoot,
      ".sdlc"
    );

  const directories = [
    sdlcPath,
    path.join(
      sdlcPath,
      "context"
    ),
    path.join(
      sdlcPath,
      "storycraft"
    )
  ];

  for (
    const directory
    of directories
  ) {

    fs.mkdirSync(
      directory,
      {
        recursive: true
      }
    );
  }

  const configPath =
    path.join(
      sdlcPath,
      "config.yaml"
    );

  if (
    fs.existsSync(
      configPath
    )
  ) {

    console.log("");

    console.log(
      "StoryCraft is already initialized in this project."
    );

    console.log(
      "Existing config.yaml was not changed."
    );

    console.log("");

    return;
  }

  const projectName =
    await input({
      message:
        "Project name:",
      validate:
        (
          value
        ) => {

          if (
            !value.trim()
          ) {

            return (
              "Project name is required."
            );
          }

          return true;
        }
    });


  /*
   * Create VS Code instruction file.
   */

  const githubDirectory =
    path.join(
      projectRoot,
      ".github"
    );

  fs.mkdirSync(
    githubDirectory,
    {
      recursive: true
    }
  );

  const copilotInstructionsPath =
    path.join(
      githubDirectory,
      "copilot-instructions.md"
    );

  if (
    !fs.existsSync(
      copilotInstructionsPath
    )
  ) {

    fs.writeFileSync(
      copilotInstructionsPath,
      createCopilotInstructions(),
      "utf8"
    );
  }


  /*
   * StoryCraft configuration.
   */

  const config =
    `project:
  name: "${escapeYaml(projectName.trim())}"

jira:
  enabled: true
  provider: "jira"
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


  /*
   * Context templates.
   */

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

  console.log(
    ".sdlc/"
  );

  console.log(
    "├── config.yaml"
  );

  console.log(
    "├── context/"
  );

  console.log(
    "│   ├── problem.json"
  );

  console.log(
    "│   ├── solution.json"
  );

  console.log(
    "│   └── hld.json"
  );

  console.log(
    "└── storycraft/"
  );

  console.log("");

  console.log(
    "VS Code instructions:"
  );

  console.log(
    ".github/copilot-instructions.md"
  );

  console.log("");
}


// ==================================================
// CONTEXT FILE
// ==================================================

function createContextFile(
  sdlcPath: string,
  fileName: string,
  content: string
): void {

  const filePath =
    path.join(
      sdlcPath,
      "context",
      fileName
    );

  if (
    !fs.existsSync(
      filePath
    )
  ) {

    fs.writeFileSync(
      filePath,
      content,
      "utf8"
    );
  }
}


// ==================================================
// PROBLEM TEMPLATE
// ==================================================

function createProblemTemplate(
  projectName: string
): string {

  return JSON.stringify(
    {
      version:
        "1.0",

      project:
        projectName,

      status:
        "not_available",

      problem: {
        statement:
          "",

        businessImpact:
          "",

        stakeholders:
          [],

        successMetrics:
          []
      }
    },
    null,
    2
  );
}


// ==================================================
// SOLUTION TEMPLATE
// ==================================================

function createSolutionTemplate(
  projectName: string
): string {

  return JSON.stringify(
    {
      version:
        "1.0",

      project:
        projectName,

      status:
        "not_available",

      solution: {
        description:
          "",

        objectives:
          [],

        features:
          [],

        assumptions:
          [],

        risks:
          []
      }
    },
    null,
    2
  );
}


// ==================================================
// HLD TEMPLATE
// ==================================================

function createHldTemplate(
  projectName: string
): string {

  return JSON.stringify(
    {
      version:
        "1.0",

      project:
        projectName,

      status:
        "not_available",

      hld: {
        description:
          "",

        components:
          [],

        integrations:
          [],

        dataSources:
          [],

        securityRequirements:
          [],

        nonFunctionalRequirements:
          []
      }
    },
    null,
    2
  );
}


// ==================================================
// CREATE STORIES FILE
// ==================================================

export function createStoriesFile():
  void {

  const storiesPath =
    path.join(
      process.cwd(),
      ".sdlc",
      "storycraft",
      "stories.json"
    );

  if (
    fs.existsSync(
      storiesPath
    )
  ) {

    console.log("");

    console.log(
      "stories.json already exists."
    );

    console.log("");

    return;
  }

  const content =
    JSON.stringify(
      {
        version:
          "1.0",

        generatedBy:
          "manual",

        epics:
          [],

        stories:
          []
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


// ==================================================
// VALIDATE STORIES
// ==================================================

export function validateStoriesFile():
  void {

  const storiesPath =
    path.join(
      process.cwd(),
      ".sdlc",
      "storycraft",
      "stories.json"
    );

  if (
    !fs.existsSync(
      storiesPath
    )
  ) {

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
      JSON.parse(
        fileContent
      );

    const result =
      validateStoryDocument(
        document
      );

    console.log("");

    console.log(
      "StoryCraft Document Validator"
    );

    console.log(
      "============================="
    );

    console.log("");

    if (
      result.errors.length > 0
    ) {

      console.log(
        "Errors:"
      );

      for (
        const error
        of result.errors
      ) {

        console.log(
          `  ✗ ${error}`
        );
      }

      console.log("");
    }

    if (
      result.warnings.length > 0
    ) {

      console.log(
        "Warnings:"
      );

      for (
        const warning
        of result.warnings
      ) {

        console.log(
          `  ⚠ ${warning}`
        );
      }

      console.log("");
    }

    if (
      result.passed
    ) {

      console.log(
        "✓ Story document validation PASSED."
      );

    } else {

      console.log(
        "✗ Story document validation FAILED."
      );
    }

    console.log("");

    if (
      !result.passed
    ) {

      process.exitCode =
        1;
    }

  } catch (error) {

    console.log("");

    console.log(
      "✗ Unable to validate stories.json."
    );

    if (
      error instanceof Error
    ) {

      console.log(
        `  ${error.message}`
      );
    }

    console.log("");

    process.exitCode =
      1;
  }
}


// ==================================================
// GENERATE STORIES
// ==================================================

export async function generateStories():
  Promise<void> {

  console.log("");

  console.log(
    "StoryCraft Story Generator"
  );

  console.log(
    "--------------------------"
  );

  try {

    const config =
      loadConfig();

    const context =
      loadContext();

    const provider =
      createAIProvider(
        config.ai.provider
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

    saveGenerationResult(
      generationResult,
      provider.name
    );

    console.log("");

    console.log(
      `Generated ${generationResult.epics.length} epic(s).`
    );

    console.log(
      `Generated ${generationResult.stories.length} story(s).`
    );

    console.log("");

    console.log(
      "Output: .sdlc/storycraft/stories.json"
    );

    console.log("");

  } catch (error) {

    console.error("");

    if (
      error instanceof Error
    ) {

      console.error(
        error.message
      );

    } else {

      console.error(
        "Story generation failed."
      );
    }

    console.error("");

    process.exitCode =
      1;
  }
}


// ==================================================
// RUN
// ==================================================

export async function runStoryCraft():
  Promise<void> {

  console.log("");

  console.log(
    "StoryCraft Workflow"
  );

  console.log(
    "==================="
  );

  console.log("");

  try {

    const config =
      loadConfig();

    await executeGenerationWorkflow(
      config
    );

  } catch (error) {

    console.error("");

    console.error(
      "StoryCraft workflow failed."
    );

    console.error("");

    if (
      error instanceof Error
    ) {

      console.error(
        error.message
      );
    }

    console.error("");
  }
}


// ==================================================
// START
// ==================================================

export async function startStoryCraft():
  Promise<void> {

  console.log("");

  console.log(
    "StoryCraft Developer Workflow"
  );

  console.log(
    "============================="
  );

  console.log("");

  const config =
    loadConfig();

  console.log(
    `Project: ${config.project.name}`
  );

  console.log("");


  /*
   * --------------------------------------------------
   * STEP 1
   * Context
   * --------------------------------------------------
   */

  console.log(
    "1. Loading context..."
  );

  const context =
    loadContext();

  console.log(
    "   ✓ Context loaded"
  );

  console.log("");


  /*
   * --------------------------------------------------
   * STEP 2
   * Context validation
   * --------------------------------------------------
   */

  console.log(
    "2. Validating context..."
  );

  const contextResult =
    validateContext(
      context
    );

  if (
    !contextResult.passed
  ) {

    console.log(
      "   ✗ Context validation failed."
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

    return;
  }

  console.log(
    "   ✓ Context validation passed"
  );

  console.log("");


  /*
   * --------------------------------------------------
   * STEP 3
   * Configuration
   * --------------------------------------------------
   */

  console.log(
    "3. Loading configuration..."
  );

  console.log(
    `   ✓ AI Provider: ${config.ai.provider}`
  );

  console.log(
    `   ✓ AI Mode: ${getAIMode(config)}`
  );

  console.log("");



  /*
   * --------------------------------------------------
   * STEP 4
   * HLD
   * --------------------------------------------------
   */

  console.log(
    "4. Loading HLD..."
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



  /*
   * --------------------------------------------------
   * STEP 5
   * Jira
   * --------------------------------------------------
   */

  console.log(
    "5. Checking Jira..."
  );

  if (
    config.jira.enabled
  ) {

    if (
      !config.jira.project_key
    ) {

      console.log(
        "   ! No Jira project selected."
      );

      console.log("");

      console.log(
        "Run:"
      );

      console.log(
        "sdlc storycraft jira-setup"
      );

      console.log("");

      return;
    }

    console.log(
      `   ✓ Jira project: ${config.jira.project_key}`
    );

  } else {

    console.log(
      "   ✓ Jira integration disabled"
    );
  }

  console.log("");



  /*
   * --------------------------------------------------
   * STEP 6
   * AI
   * --------------------------------------------------
   */

  const mode =
    getAIMode(
      config
    );

  if (
    mode === "vscode"
  ) {

    await prepareVSCodeWorkflow(
      context,
      hld
    );

    return;
  }


  /*
   * Direct API
   */

  console.log(
    "6. Generating Epics + Stories..."
  );

  const provider =
    createAIProvider(
      config.ai.provider
    );

  const generationResult =
    await provider.generateStories({
      context,
      hld
    });

  console.log(
    `   ✓ Generated ${generationResult.epics.length} epic(s)`
  );

  console.log(
    `   ✓ Generated ${generationResult.stories.length} story(s)`
  );

  console.log("");

  await completeGeneratedWorkflow(
    generationResult,
    provider.name
  );
}


// ==================================================
// CONTINUE
// ==================================================

export async function continueStoryCraft():
  Promise<void> {

  console.log("");

  console.log(
    "StoryCraft Workflow Continuation"
  );

  console.log(
    "================================"
  );

  console.log("");

  const responsePath =
    path.join(
      process.cwd(),
      ".sdlc",
      "storycraft",
      "ai-response.json"
    );

  if (
    !fs.existsSync(
      responsePath
    )
  ) {

    throw new Error(
      [
        "VS Code AI response was not found.",
        "",
        "Expected:",
        ".sdlc/storycraft/ai-response.json",
        "",
        "Open GitHub Copilot Chat or Claude in VS Code",
        "and execute the instructions in:",
        ".sdlc/storycraft/ai-task.md"
      ].join("\n")
    );
  }

  console.log(
    "1. Loading AI response..."
  );

  const responseText =
    fs.readFileSync(
      responsePath,
      "utf8"
    );

  let parsed: unknown;

  try {

    parsed =
      JSON.parse(
        responseText
      );

  } catch {

    throw new Error(
      "ai-response.json contains invalid JSON."
    );
  }

  if (
    !isObject(
      parsed
    )
  ) {

    throw new Error(
      "AI response must be a JSON object."
    );
  }

  if (
    !Array.isArray(
      parsed.epics
    )
  ) {

    throw new Error(
      "AI response is missing the 'epics' array."
    );
  }

  if (
    !Array.isArray(
      parsed.stories
    )
  ) {

    throw new Error(
      "AI response is missing the 'stories' array."
    );
  }

  const generationResult:
    StoryGenerationResult = {
    epics:
      parsed.epics as Epic[],

    stories:
      parsed.stories as Story[]
  };

  console.log(
    `   ✓ ${generationResult.epics.length} epic(s) received`
  );

  console.log(
    `   ✓ ${generationResult.stories.length} story(s) received`
  );

  console.log("");

  await completeGeneratedWorkflow(
    generationResult,
    "vscode-ai"
  );
}


// ==================================================
// PREPARE VS CODE WORKFLOW
// ==================================================

async function prepareVSCodeWorkflow(
  context: ReturnType<typeof loadContext>,
  hld: {
    source: string;
    content: string;
  }
): Promise<void> {

  console.log(
    "6. Preparing VS Code AI workflow..."
  );

  const storycraftPath =
    path.join(
      process.cwd(),
      ".sdlc",
      "storycraft"
    );

  fs.mkdirSync(
    storycraftPath,
    {
      recursive: true
    }
  );


  const taskPath =
    path.join(
      storycraftPath,
      "ai-task.md"
    );


  const responsePath =
    path.join(
      storycraftPath,
      "ai-response.json"
    );


  /*
   * Remove previous AI response.
   *
   * This is important because we do not
   * want StoryCraft to accidentally process
   * yesterday's AI response.
   */

  if (
    fs.existsSync(
      responsePath
    )
  ) {

    fs.unlinkSync(
      responsePath
    );
  }


  const prompt =
    buildVSCodeTask(
      context,
      hld
    );


  fs.writeFileSync(
    taskPath,
    prompt,
    "utf8"
  );


  console.log(
    "   ✓ AI task created:"
  );

  console.log(
    "     .sdlc/storycraft/ai-task.md"
  );

  console.log("");

  console.log(
    "Open GitHub Copilot Chat or Claude in VS Code."
  );

  console.log("");

  console.log(
    "Give it this command:"
  );

  console.log("");

  console.log(
    "Run the StoryCraft task from .sdlc/storycraft/ai-task.md"
  );

  console.log("");

  console.log(
    "The AI must save ONLY the JSON result to:"
  );

  console.log("");

  console.log(
    ".sdlc/storycraft/ai-response.json"
  );

  console.log("");

  console.log(
    "After AI finishes, run:"
  );

  console.log("");

  console.log(
    "sdlc storycraft continue"
  );

  console.log("");
}


// ==================================================
// COMPLETE GENERATED WORKFLOW
// ==================================================

async function completeGeneratedWorkflow(
  generationResult: StoryGenerationResult,
  generatedBy: string
): Promise<void> {

  console.log(
    "7. Validating stories..."
  );

  const validationDocument = {
    version:
      "1.0",

    generatedBy,

    epics:
      generationResult.epics,

    stories:
      generationResult.stories
  };


  const validationResult =
    validateStoryDocument(
      validationDocument
    );


  if (
    !validationResult.passed
  ) {

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

    throw new Error(
      "Story validation failed. Human review was not started."
    );
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


  /*
   * Save stories.
   */

  console.log(
    "8. Saving stories..."
  );

  saveGenerationResult(
    generationResult,
    generatedBy
  );

  console.log(
    "   ✓ .sdlc/storycraft/stories.json"
  );

  console.log(
    "   ✓ .sdlc/storycraft/story-graph.json"
  );

  console.log("");


  /*
   * Human review.
   */

  console.log(
    "9. Starting human review..."
  );

  console.log("");

  await reviewStories();

  const review =
    validateReview();


  if (
    !review.approved
  ) {

    console.log("");

    console.log(
      "Workflow stopped."
    );

    console.log(
      "Stories were not approved."
    );

    console.log("");

    return;
  }


  /*
   * Jira.
   */

  const config =
    loadConfig();


  if (
    !config.jira.enabled
  ) {

    console.log("");

    console.log(
      "Jira integration is disabled."
    );

    console.log("");

    console.log(
      "StoryCraft workflow completed."
    );

    console.log("");

    return;
  }


  if (
    !config.jira.project_key
  ) {

    throw new Error(
      [
        "Jira project is not configured.",
        "",
        "Run:",
        "sdlc storycraft jira-setup"
      ].join("\n")
    );
  }


  console.log("");

  console.log(
    "10. Jira creation"
  );

  console.log("");

  const createJira =
    await confirm({
      message:
        `Create approved stories in Jira project ${config.jira.project_key}?`,
      default:
        true
    });


  if (
    !createJira
  ) {

    console.log("");

    console.log(
      "Jira creation skipped."
    );

    console.log("");

    return;
  }


  await runJiraWorkflow();


  console.log("");

  console.log(
    "================================"
  );

  console.log(
    "StoryCraft workflow completed."
  );

  console.log(
    "Status: COMPLETED"
  );

  console.log(
    "================================"
  );

  console.log("");
}


// ==================================================
// OLD COMPLETE WORKFLOW
// ==================================================

export async function runStoryCraftWorkflow():
  Promise<void> {

  console.log("");

  console.log(
    "StoryCraft Developer Workflow"
  );

  console.log(
    "============================="
  );

  console.log("");

  const config =
    loadConfig();


  const mode =
    getAIMode(
      config
    );


  /*
   * New workflow.
   *
   * This is now the preferred command.
   */

  if (
    mode === "vscode" ||
    mode === "direct"
  ) {

    await startStoryCraft();

    return;
  }


  /*
   * Fallback for old configuration.
   */

  await runStoryCraft();

  console.log("");

  console.log(
    "Starting human review..."
  );

  console.log("");

  await reviewStories();

  const review =
    validateReview();


  if (
    !review.approved
  ) {

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


// ==================================================
// REVIEW
// ==================================================

export async function reviewStories():
  Promise<void> {

  const storiesPath =
    path.join(
      process.cwd(),
      ".sdlc",
      "storycraft",
      "stories.json"
    );


  if (
    !fs.existsSync(
      storiesPath
    )
  ) {

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
    JSON.parse(
      content
    );


  if (
    !Array.isArray(
      data.stories
    ) ||
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


  if (
    Array.isArray(
      data.epics
    )
  ) {

    console.log(
      `Epics: ${data.epics.length}`
    );

    console.log(
      `Stories: ${data.stories.length}`
    );

    console.log("");
  }


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


    if (
      Array.isArray(
        story.technicalRequirements
      )
    ) {

      console.log("");

      console.log(
        "Technical Requirements:"
      );

      for (
        const requirement
        of story.technicalRequirements
      ) {

        console.log(
          `  - ${requirement}`
        );
      }
    }


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


    if (
      Array.isArray(
        story.dependencies
      ) &&
      story.dependencies.length > 0
    ) {

      console.log("");

      console.log(
        "Dependencies:"
      );

      for (
        const dependency
        of story.dependencies
      ) {

        console.log(
          `  - ${dependency}`
        );
      }
    }


    if (
      Array.isArray(
        story.hldReferences
      ) &&
      story.hldReferences.length > 0
    ) {

      console.log("");

      console.log(
        "HLD References:"
      );

      for (
        const reference
        of story.hldReferences
      ) {

        console.log(
          `  - ${reference}`
        );
      }
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
      default:
        false
    });


  const reviewPath =
    path.join(
      process.cwd(),
      ".sdlc",
      "storycraft",
      "review.json"
    );


  const review = {
    version:
      "1.0",

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


  if (
    approved
  ) {

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


// ==================================================
// GENERATION WORKFLOW
// ==================================================

async function executeGenerationWorkflow(
  config: ReturnType<typeof loadConfig>
): Promise<void> {

  console.log(
    "1. Loading context..."
  );

  const context =
    loadContext();

  console.log(
    "   ✓ Context loaded"
  );

  console.log("");

  console.log(
    "2. Validating context..."
  );

  const contextResult =
    validateContext(
      context
    );


  if (
    !contextResult.passed
  ) {

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

    return;
  }


  console.log(
    "   ✓ Context validation passed"
  );

  console.log("");

  console.log(
    "3. Loading configuration..."
  );

  console.log(
    `   ✓ AI Provider: ${config.ai.provider}`
  );

  console.log("");

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


  if (
    getAIMode(config) ===
    "vscode"
  ) {

    await prepareVSCodeWorkflow(
      context,
      hld
    );

    return;
  }


  console.log(
    "4. Generating stories..."
  );


  const provider =
    createAIProvider(
      config.ai.provider
    );


  const generationResult =
    await provider.generateStories({
      context,
      hld
    });


  console.log(
    `   ✓ Generated ${generationResult.epics.length} epic(s)`
  );

  console.log(
    `   ✓ Generated ${generationResult.stories.length} story(s)`
  );

  console.log("");


  await completeGeneratedWorkflow(
    generationResult,
    provider.name
  );
}


// ==================================================
// SAVE GENERATION RESULT
// ==================================================

function saveGenerationResult(
  generationResult: StoryGenerationResult,
  generatedBy: string
): void {

  const storycraftPath =
    path.join(
      process.cwd(),
      ".sdlc",
      "storycraft"
    );


  fs.mkdirSync(
    storycraftPath,
    {
      recursive: true
    }
  );


  const output = {
    version:
      "1.0",

    generatedBy,

    epics:
      generationResult.epics,

    stories:
      generationResult.stories
  };


  const storiesPath =
    path.join(
      storycraftPath,
      "stories.json"
    );


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
    buildStoryGraph(
      generationResult.stories
    );


  const graphPath =
    path.join(
      storycraftPath,
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
}


// ==================================================
// AI MODE
// ==================================================

function getAIMode(
  config: ReturnType<typeof loadConfig>
): "vscode" | "direct" {

  const ai =
    config.ai as
    typeof config.ai & {
      mode?: string;
    };


  if (
    ai.mode ===
    "direct"
  ) {

    return "direct";
  }


  /*
   * Default to VS Code.
   *
   * This is intentional because StoryCraft
   * is designed to work with Copilot/Claude
   * inside the developer's IDE.
   */

  return "vscode";
}


// ==================================================
// VS CODE TASK
// ==================================================

function buildVSCodeTask(
  context: ReturnType<typeof loadContext>,
  hld: {
    source: string;
    content: string;
  }
): string {

  return `# StoryCraft AI Developer Task

You are the AI execution engine for StoryCraft.

You are operating inside the developer's existing software project.

Your job is to transform the project's actual SDLC context and HLD into production-ready Epics and User Stories.

IMPORTANT:

The supplied context and HLD are the source of truth.

DO NOT invent requirements.

DO NOT create generic demo stories.

DO NOT create fake example domains such as:
- Order API
- Product API
- User API
- Authentication API

unless those requirements actually exist in the supplied project context.

---

# EXECUTION PROCESS

Follow these steps:

1. Read the StoryCraft context.
2. Understand the actual business problem.
3. Understand the actual proposed solution.
4. Understand the actual HLD.
5. Identify real business capabilities.
6. Group capabilities into Epics.
7. Break Epics into implementation-ready User Stories.
8. Ensure every Story belongs to an Epic.
9. Add meaningful acceptance criteria.
10. Add technical requirements where supported.
11. Identify Story dependencies.
12. Reference the actual HLD.
13. Estimate Story Points from 1 to 13.
14. Do not duplicate Stories.
15. Do not create unsupported functionality.
16. Respect security and non-functional requirements.
17. Keep MVP requirements separate from future ideas.
18. Return only the requested JSON structure.

---

# STORY QUALITY RULES

Every Story must be:

- understandable by a Product Owner
- implementable by a developer
- testable by QA
- traceable to the HLD
- connected to a real business capability

Avoid:

- vague stories
- placeholder stories
- generic CRUD stories
- invented APIs
- invented integrations
- invented databases
- invented business rules

---

# REQUIRED OUTPUT

Return ONLY valid JSON.

Do not use markdown fences.

Use exactly this structure:

{
  "version": "1.0",
  "generatedBy": "vscode-ai",
  "epics": [
    {
      "id": "EPIC-001",
      "title": "...",
      "description": "...",
      "businessValue": "..."
    }
  ],
  "stories": [
    {
      "id": "ST-001",
      "epicId": "EPIC-001",
      "title": "...",
      "description": "...",
      "businessValue": "...",
      "acceptanceCriteria": [
        "..."
      ],
      "technicalRequirements": [
        "..."
      ],
      "dependencies": [],
      "hldReferences": [
        "..."
      ],
      "estimate": {
        "storyPoints": 5
      }
    }
  ]
}

---

# STORYCRAFT CONTEXT

## Problem Discovery

${JSON.stringify(
    context.problem,
    null,
    2
  )}

---

## Solution Discovery

${JSON.stringify(
    context.solution,
    null,
    2
  )}

---

# HIGH LEVEL DESIGN

HLD Source:

${hld.source}

HLD Content:

${hld.content}

---

# FINAL INSTRUCTION

Generate the complete production-ready StoryCraft Epics and Stories.

Use the actual project requirements.

Do not invent requirements.

Return ONLY JSON.

Save the final JSON result to:

.sdlc/storycraft/ai-response.json
`;
}


// ==================================================
// COPILOT INSTRUCTIONS
// ==================================================

function createCopilotInstructions():
  string {

  return `# StoryCraft

This project uses StoryCraft for developer-driven SDLC automation.

When the developer asks you to execute StoryCraft:

1. Read .sdlc/storycraft/ai-task.md
2. Read the referenced project context.
3. Read the HLD.
4. Follow the StoryCraft task exactly.
5. Do not invent requirements.
6. Do not generate generic example stories.
7. Generate implementation-ready Epics and Stories.
8. Return only valid JSON.
9. Save the final result to:

.sdlc/storycraft/ai-response.json

Do not modify the StoryCraft output format.

Human approval is required before Jira creation.
`;
}


// ==================================================
// YAML ESCAPE
// ==================================================

function escapeYaml(
  value: string
): string {

  return value
    .replace(
      /\\/g,
      "\\\\"
    )
    .replace(
      /"/g,
      '\\"'
    );
}


// ==================================================
// OBJECT CHECK
// ==================================================

function isObject(
  value: unknown
): value is Record<
  string,
  any
> {

  return (
    typeof value ===
    "object" &&
    value !== null &&
    !Array.isArray(
      value
    )
  );
}