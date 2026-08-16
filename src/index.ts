#!/usr/bin/env node

import { Command } from "commander";

import {
  loadConfig,
  saveConfig
} from "./config.js";

import { runDoctor } from "./commands/doctor.js";

import {
  initStoryCraft,
  createStoriesFile,
  validateStoriesFile,
  generateStories,
  runStoryCraft,
  runStoryCraftWorkflow,
  reviewStories
} from "./commands/storycraft.js";

import { loadContext } from "./context/context-loader.js";
import { validateContext } from "./validation/context-validator.js";
import { validateReview } from "./validation/review-validator.js";
import { createJiraProvider } from "./jira/jira-provider-factory.js";

import {
  select,
  input,
  confirm
} from "@inquirer/prompts";

import fs from "node:fs";
import path from "node:path";

const program = new Command();

program
  .name("sdlc")
  .description("Company SDLC automation CLI")
  .version("1.0.0");

const storycraft = program
  .command("storycraft")
  .description("Create and manage software stories");

// --------------------------------------------------
// INIT
// --------------------------------------------------

storycraft
  .command("init")
  .description(
    "Initialize StoryCraft in the current project"
  )
  .action(async () => {
    await initStoryCraft();
  });

// --------------------------------------------------
// CONFIG
// --------------------------------------------------

storycraft
  .command("config")
  .description(
    "Show StoryCraft configuration"
  )
  .action(() => {
    const config = loadConfig();

    console.log("");
    console.log(
      "StoryCraft Configuration"
    );
    console.log(
      "------------------------"
    );
    console.log(
      JSON.stringify(
        config,
        null,
        2
      )
    );
    console.log("");
  });

// --------------------------------------------------
// DOCTOR
// --------------------------------------------------

storycraft
  .command("doctor")
  .description(
    "Check StoryCraft project configuration"
  )
  .action(() => {
    runDoctor();
  });

// --------------------------------------------------
// CREATE
// --------------------------------------------------

storycraft
  .command("create")
  .description(
    "Create the StoryCraft stories file"
  )
  .action(() => {
    createStoriesFile();
  });

// --------------------------------------------------
// VALIDATE STORIES
// --------------------------------------------------

storycraft
  .command("validate")
  .description(
    "Validate StoryCraft stories"
  )
  .action(() => {
    validateStoriesFile();
  });

// --------------------------------------------------
// CONTEXT
// --------------------------------------------------

storycraft
  .command("context")
  .description(
    "Show the StoryCraft context"
  )
  .action(() => {
    try {
      const context =
        loadContext();

      console.log("");
      console.log(
        "StoryCraft Context"
      );
      console.log(
        "------------------"
      );
      console.log(
        JSON.stringify(
          context,
          null,
          2
        )
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
          "Failed to load StoryCraft context."
        );
      }

      console.error("");

      process.exitCode = 1;
    }
  });

// --------------------------------------------------
// VALIDATE CONTEXT
// --------------------------------------------------

storycraft
  .command("validate-context")
  .description(
    "Validate StoryCraft context"
  )
  .action(() => {
    try {
      const context =
        loadContext();

      const result =
        validateContext(
          context
        );

      console.log("");
      console.log(
        "Context Validator"
      );
      console.log(
        "-----------------"
      );

      if (result.passed) {
        console.log(
          "✓ Problem context"
        );
        console.log(
          "✓ Solution context"
        );
        console.log(
          "✓ HLD context"
        );
        console.log("");

        console.log(
          "Context validation PASSED."
        );
      } else {
        console.log(
          "Context validation FAILED."
        );

        console.log("");

        for (
          const error
          of result.errors
        ) {
          console.log(
            `✗ ${error}`
          );
        }
      }

      console.log("");
    } catch (error) {
      console.error("");

      if (error instanceof Error) {
        console.error(
          error.message
        );
      } else {
        console.error(
          "Failed to validate context."
        );
      }

      console.error("");

      process.exitCode = 1;
    }
  });

// --------------------------------------------------
// GENERATE
// --------------------------------------------------

storycraft
  .command("generate")
  .description(
    "Generate stories from the StoryCraft context"
  )
  .action(async () => {
    await generateStories();
  });

// --------------------------------------------------
// RUN
// --------------------------------------------------

storycraft
  .command("run")
  .description(
    "Run the complete StoryCraft workflow"
  )
  .action(async () => {
    await runStoryCraft();
  });

// --------------------------------------------------
// WORKFLOW
// --------------------------------------------------

storycraft
  .command("workflow")
  .description(
    "Run the developer-driven StoryCraft workflow"
  )
  .action(async () => {
    await runStoryCraftWorkflow();
  });

// --------------------------------------------------
// REVIEW
// --------------------------------------------------

storycraft
  .command("review")
  .description(
    "Review generated StoryCraft stories"
  )
  .action(async () => {
    await reviewStories();
  });

// --------------------------------------------------
// REVIEW STATUS
// --------------------------------------------------

storycraft
  .command("review-status")
  .description(
    "Check human review status"
  )
  .action(() => {
    const result =
      validateReview();

    console.log("");
    console.log(
      "Human Review Status"
    );
    console.log(
      "-------------------"
    );

    if (result.approved) {
      console.log(
        "✓ APPROVED"
      );
    } else {
      console.log(
        "✗ NOT APPROVED"
      );
    }

    console.log(
      result.message
    );

    console.log("");
  });

// --------------------------------------------------
// JIRA PROJECTS
// --------------------------------------------------

storycraft
  .command("jira-projects")
  .description(
    "List available Jira projects"
  )
  .action(async () => {
    try {
      const config =
        loadConfig();

      if (!config.jira.enabled) {
        console.log("");
        console.log(
          "Jira integration is disabled."
        );
        console.log("");
        return;
      }

      const jira =
        createJiraProvider(
          config.jira.provider
        );

      const projects =
        await jira.listProjects();

      console.log("");
      console.log(
        "Available Jira Projects"
      );
      console.log(
        "-----------------------"
      );
      console.log("");

      projects.forEach(
        (project, index) => {
          console.log(
            `${index + 1}. ${project.key} - ${project.name}`
          );
        }
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
          "Failed to load Jira projects."
        );
      }

      console.error("");

      process.exitCode = 1;
    }
  });

// --------------------------------------------------
// JIRA SETUP
// --------------------------------------------------

storycraft
  .command("jira-setup")
  .description(
    "Select or create a Jira project"
  )
  .action(async () => {
    try {
      const config =
        loadConfig();

      if (!config.jira.enabled) {
        console.log("");
        console.log(
          "Jira integration is disabled."
        );
        console.log("");
        return;
      }

      const jira =
        createJiraProvider(
          config.jira.provider
        );

      const action =
        await select({
          message:
            "What do you want to do?",
          choices: [
            {
              name:
                "Use existing Jira project",
              value:
                "existing"
            },
            {
              name:
                "Create new Jira project",
              value:
                "new"
            }
          ]
        });

      if (
        action === "existing"
      ) {
        const projects =
          await jira.listProjects();

        if (
          projects.length === 0
        ) {
          console.log("");
          console.log(
            "No Jira projects are available."
          );
          console.log("");
          return;
        }

        const selectedProject =
          await select({
            message:
              "Select Jira project:",
            choices:
              projects.map(
                (project) => ({
                  name:
                    `${project.key} - ${project.name}`,
                  value:
                    project
                })
              )
          });

        config.jira.project_key =
          selectedProject.key;

        console.log("");
        console.log(
          `Selected Jira project: ${selectedProject.key}`
        );
      } else {
        const key =
          await input({
            message:
              "New Jira project key:",
            validate:
              (value) => {
                if (
                  !value.trim()
                ) {
                  return (
                    "Project key is required."
                  );
                }

                return true;
              }
          });

        const name =
          await input({
            message:
              "New Jira project name:",
            validate:
              (value) => {
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

        const project =
          await jira.createProject(
            key
              .trim()
              .toUpperCase(),
            name.trim()
          );

        config.jira.project_key =
          project.key;

        console.log("");
        console.log(
          `Created Jira project: ${project.key}`
        );
      }

      saveConfig(
        config
      );

      console.log("");
      console.log(
        "Jira project configuration saved."
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
          "Jira project setup failed."
        );
      }

      console.error("");

      process.exitCode = 1;
    }
  });

// --------------------------------------------------
// JIRA CREATE
// --------------------------------------------------

storycraft
  .command("jira-create")
  .description(
    "Create approved stories in Jira"
  )
  .action(async () => {
    try {
      console.log("");
      console.log(
        "StoryCraft Jira Creation"
      );
      console.log(
        "========================"
      );
      console.log("");

      const review =
        validateReview();

      if (
        !review.approved
      ) {
        console.log(
          "✗ Jira creation blocked."
        );

        console.log(
          review.message
        );

        console.log("");

        return;
      }

      const config =
        loadConfig();

      if (
        !config.jira.enabled
      ) {
        console.log(
          "Jira integration is disabled."
        );
        console.log("");

        return;
      }

      if (
        !config.jira.project_key
      ) {
        console.log(
          "No Jira project has been configured."
        );

        console.log(
          "Run: sdlc storycraft jira-setup"
        );

        console.log("");

        return;
      }

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
        console.log(
          "stories.json not found."
        );

        console.log(
          "Run: sdlc storycraft run"
        );

        console.log("");

        return;
      }

      const storiesData =
        JSON.parse(
          fs.readFileSync(
            storiesPath,
            "utf8"
          )
        );

      const jira =
        createJiraProvider(
          config.jira.provider
        );

      const projectKey =
        config.jira.project_key;

      const resultPath =
        path.join(
          process.cwd(),
          ".sdlc",
          "storycraft",
          "jira-result.json"
        );

      const jiraResult = {
        version: "1.0",

        projectKey,

        createdAt:
          new Date().toISOString(),

        epics:
          [] as Array<{
            storyCraftEpicId:
            string;
            jiraEpicKey:
            string;
          }>,

        stories:
          [] as Array<{
            storyCraftStoryId:
            string;
            jiraStoryKey:
            string;
          }>
      };

      console.log(
        `Jira Project: ${projectKey}`
      );

      console.log("");

      if (
        fs.existsSync(
          resultPath
        )
      ) {
        console.log(
          "Jira creation has already been performed for this project."
        );

        console.log("");

        console.log(
          "Result: .sdlc/storycraft/jira-result.json"
        );

        console.log("");

        return;
      }

      const epics =
        storiesData.epics ??
        [];

      for (
        const epic
        of epics
      ) {
        const createdEpic =
          await jira.createEpic(
            projectKey,
            epic.title,
            epic.description
          );

        console.log(
          `✓ Epic created: ${createdEpic.key}`
        );

        jiraResult.epics.push({
          storyCraftEpicId:
            epic.id,

          jiraEpicKey:
            createdEpic.key
        });

        const epicStories =
          storiesData.stories.filter(
            (
              story: {
                epicId:
                string;
              }
            ) =>
              story.epicId ===
              epic.id
          );

        for (
          const story
          of epicStories
        ) {
          const createdStory =
            await jira.createStory(
              projectKey,
              createdEpic.key,
              story.title,
              story.description
            );

          console.log(
            `  ✓ Story created: ${createdStory.key} - ${createdStory.title}`
          );

          jiraResult.stories.push({
            storyCraftStoryId:
              story.id,

            jiraStoryKey:
              createdStory.key
          });
        }
      }

      fs.writeFileSync(
        resultPath,
        JSON.stringify(
          jiraResult,
          null,
          2
        ),
        "utf8"
      );

      console.log(
        "✓ Jira result saved: .sdlc/storycraft/jira-result.json"
      );

      console.log("");
      console.log(
        "Jira creation completed successfully."
      );
      console.log("");
    } catch (error) {
      console.error("");

      console.error(
        "Jira creation failed."
      );

      if (
        error instanceof Error
      ) {
        console.error(
          error.message
        );
      }

      console.error("");

      process.exitCode = 1;
    }
  });

program.parse();