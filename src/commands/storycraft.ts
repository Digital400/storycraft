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
	loadContext,
	StoryCraftContext
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
	validateReview
} from "../validation/review-validator.js";

import {
	createJiraProvider
} from "../jira/jira-provider-factory.js";

import type {
	StoryGenerationResult
} from "../ai/ai-provider.js";

import type {
	StoryCraftGenerationDocument
} from "../schemas/storycraft-generation.js";


interface JiraCreationResult {
	version: string;
	status: "in_progress" | "completed" | "failed";
	projectKey: string;
	createdAt: string;
	completedAt?: string;
	epics: Array<{
		storyCraftId: string;
		jiraKey: string;
	}>;
	stories: Array<{
		storyCraftId: string;
		jiraKey: string;
	}>;
	tasks: Array<{
		storyCraftId: string;
		jiraKey: string;
	}>;
	errors: string[];
}


// ==================================================
// INIT
// ==================================================

export async function initStoryCraft(
	options?: {
		nonInteractive?: boolean;
	}
): Promise<void> {

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
		),
		path.join(
			projectRoot,
			".github",
			"prompts"
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

	let projectName =
		path.basename(
			projectRoot
		);

	if (!fs.existsSync(configPath)) {
		if (!options?.nonInteractive) {
			projectName =
				await input({
					message:
						"Project name:",
					default:
						projectName,
					validate:
						(
							value
						) => {
							if (!value.trim()) {
								return (
									"Project name is required."
								);
							}

							return true;
						}
				});
		}

		const config = [
			"project:",
			`  name: \"${escapeYaml(projectName.trim())}\"`,
			"",
			"jira:",
			"  enabled: true",
			"  provider: \"jira-cloud\"",
			"  base_url: \"\"",
			"  project_key: \"\"",
			"",
			"confluence:",
			"  enabled: true",
			"  space_key: \"\"",
			"",
			"ai:",
			"  provider: \"vscode\"",
			"  mode: \"vscode\"",
			"",
			"resources:",
			"  hld:",
			"    provider: \"confluence\"",
			"",
			"storycraft:",
			"  require_human_review: true",
			""
		].join("\n");

		fs.writeFileSync(
			configPath,
			config,
			"utf8"
		);
	}

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

	createCopilotFiles(
		projectRoot
	);

	createStoryCraftEnvTemplate(
		projectRoot
	);

	console.log("");
	console.log(
		"StoryCraft initialized."
	);
	console.log("");
	console.log(
		"Installed:"
	);
	console.log(
		".sdlc/"
	);
	console.log(
		".github/prompts/sdlc-storycraft-start.prompt.md"
	);
	console.log(
		".github/prompts/sdlc-start-workflow.prompt.md"
	);
	console.log(
		".github/prompts/sdlc-storycraft-generate.prompt.md"
	);
	console.log(
		".github/copilot-instructions.md"
	);
	console.log(
		".env.storycraft.example"
	);
	console.log("");
	console.log(
		"Next: copy .env.storycraft.example to .env and set your Jira/Confluence values."
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

	if (!fs.existsSync(filePath)) {
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
		getStoriesPath();

	if (fs.existsSync(storiesPath)) {
		console.log("");
		console.log(
			"stories.json already exists."
		);
		console.log("");
		return;
	}

	const content: StoryCraftGenerationDocument = {
		version:
			"1.0",
		generatedBy:
			"manual",
		epics:
			[],
		stories:
			[],
		tasks:
			[]
	};

	fs.writeFileSync(
		storiesPath,
		JSON.stringify(
			content,
			null,
			2
		),
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
		getStoriesPath();

	if (!fs.existsSync(storiesPath)) {
		console.log("");
		console.log(
			"stories.json not found."
		);
		console.log(
			"Run: sdlc storycraft start"
		);
		console.log("");
		return;
	}

	const fileContent =
		fs.readFileSync(
			storiesPath,
			"utf8"
		);

	const document =
		JSON.parse(
			fileContent
		) as StoryCraftGenerationDocument;

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

	if (result.passed) {
		console.log(
			"Validation PASSED."
		);
	} else {
		console.log(
			"Validation FAILED."
		);
	}

	if (result.errors.length > 0) {
		console.log("");
		console.log("Errors:");
		for (
			const error
			of result.errors
		) {
			console.log(
				`  - ${error}`
			);
		}
	}

	if (result.warnings.length > 0) {
		console.log("");
		console.log("Warnings:");
		for (
			const warning
			of result.warnings
		) {
			console.log(
				`  - ${warning}`
			);
		}
	}

	console.log("");

	if (!result.passed) {
		process.exitCode =
			1;
	}
}


// ==================================================
// GENERATE STORIES
// ==================================================

export async function generateStories():
	Promise<void> {

	const config =
		loadConfig();

	const context =
		loadContext();

	const hldProvider =
		createHLDProvider(
			config.resources.hld.provider
		);

	const hld =
		await hldProvider.load();

	const provider =
		createAIProvider(
			config.ai.provider,
			config.ai.mode
		);

	const generationResult =
		await provider.generateStories({
			context: withLoadedHld(
				context,
				hld.source,
				hld.content
			),
			hld
		});

	saveGenerationResult(
		generationResult,
		provider.name
	);

	console.log("");
	console.log(
		`Generated ${generationResult.epics.length} epics, ${generationResult.stories.length} stories, ${generationResult.tasks.length} tasks.`
	);
	console.log(
		"Output: .sdlc/storycraft/stories.json"
	);
	console.log("");
}


// ==================================================
// RUN
// ==================================================

export async function runStoryCraft():
	Promise<void> {
	await startStoryCraft();
}


// ==================================================
// START
// ==================================================

export async function startStoryCraft():
	Promise<void> {
	createCopilotFiles(
		process.cwd()
	);

	console.log("");
	console.log(
		"StoryCraft SDLC Workflow"
	);
	console.log(
		"========================"
	);
	console.log("");

	const config =
		loadConfig();

	console.log(
		`Project: ${config.project.name}`
	);
	console.log("");

	console.log(
		"Loading project context..."
	);

	const loadedContext =
		loadContext();

	console.log("✓");
	console.log("");

	console.log(
		"Loading HLD..."
	);

	const hldProvider =
		createHLDProvider(
			config.resources.hld.provider
		);

	const hld =
		await hldProvider.load();

	console.log(
		`✓ ${hldProvider.name}`
	);
	console.log("");

	const context = withLoadedHld(
		loadedContext,
		hld.source,
		hld.content
	);

	console.log(
		"Validating context..."
	);

	const contextResult =
		validateContext(
			context
		);

	if (!contextResult.passed) {
		console.log("✗");
		for (
			const error
			of contextResult.errors
		) {
			console.log(
				`- ${error}`
			);
		}
		console.log("");
		return;
	}

	console.log("✓");

	for (
		const warning
		of contextResult.warnings
	) {
		console.log(
			`- ${warning}`
		);
	}

	console.log("");

	let selectedProjectKey =
		config.jira.project_key;

	if (config.jira.enabled) {
		console.log(
			"Loading Jira projects..."
		);

		const jira =
			createJiraProvider(
				config.jira.provider
			);

		const projects =
			await jira.listProjects();

		if (projects.length === 0) {
			throw new Error(
				"No Jira projects are available."
			);
		}

		console.log("");
		console.log(
			"Available Jira Projects"
		);
		console.log("");

		projects.forEach(
			(
				project,
				index
			) => {
				console.log(
					`${index + 1}. ${project.key} - ${project.name}`
				);
			}
		);

		console.log("");

		const selected =
			await select({
				message:
					"Select Jira project:",
				choices:
					projects.map(
						(
							project
						) => ({
							name:
								`${project.key} - ${project.name}`,
							value:
								project
						})
					)
			});

		selectedProjectKey =
			selected.key;

		console.log("");
		console.log(
			`Selected: ${selected.key} - ${selected.name}`
		);
		console.log("");

		if (
			selectedProjectKey !== config.jira.project_key
		) {
			const saveSelected =
				await confirm({
					message:
						"Save selected Jira project to StoryCraft config?",
					default:
						false
				});

			if (saveSelected) {
				config.jira.project_key =
					selectedProjectKey;
				saveConfig(config);
			}
		}
	}

	console.log(
		"Generating Epics, Stories and Tasks..."
	);

	let provider =
		createAIProvider(
			config.ai.provider,
			config.ai.mode
		);

	let providerName =
		provider.name;

	let generationResult: StoryGenerationResult;

	try {
		generationResult =
			await provider.generateStories({
				context,
				hld
			});
	} catch (error) {
		if (
			error instanceof Error &&
			error.message.includes("ANTHROPIC_API_KEY environment variable is not set.")
		) {
			throw new Error(
				[
					"AI provider is configured as direct Claude, but ANTHROPIC_API_KEY is missing.",
					"",
					"Set these variables in your .env file and re-run:",
					"export ANTHROPIC_API_KEY=\"your-anthropic-key\"",
					"export ANTHROPIC_MODEL=\"claude-3-5-sonnet-latest\"",
					"",
					"Or switch to VS Code handoff mode in .sdlc/config.yaml:",
					"ai:",
					"  provider: \"vscode\"",
					"  mode: \"vscode\""
				].join("\n")
			);
		}

		if (
			error instanceof Error &&
			error.message.includes("ANTHROPIC_MODEL environment variable is not set.")
		) {
			throw new Error(
				[
					"AI provider is configured as direct Claude, but ANTHROPIC_MODEL is missing.",
					"",
					"Set this variable in your .env file and re-run:",
					"export ANTHROPIC_MODEL=\"claude-3-5-sonnet-latest\"",
					"",
					"You can also use VS Code handoff mode in .sdlc/config.yaml:",
					"ai:",
					"  provider: \"vscode\"",
					"  mode: \"vscode\""
				].join("\n")
			);
		}

		if (
			error instanceof Error &&
			config.ai.mode === "vscode" &&
			error.message.includes("VS Code AI handoff created.")
		) {
			console.log("");
			console.log(error.message);
			console.log("");
			console.log(
				"Workflow paused. Generate real AI output in Copilot Chat and save it to .sdlc/storycraft/ai-response.json, then run 'sdlc storycraft start' again."
			);
			console.log("");
			return;
		} else {
			throw error;
		}
	}

	const document =
		toGenerationDocument(
			generationResult,
			providerName
		);

	console.log(
		`✓ ${document.epics.length} epics, ${document.stories.length} stories, ${document.tasks.length} tasks`
	);
	console.log("");

	console.log(
		"Validating generated SDLC..."
	);

	const validationResult =
		validateStoryDocument(
			document
		);

	if (!validationResult.passed) {
		console.log("✗");
		for (
			const error
			of validationResult.errors
		) {
			console.log(
				`- ${error}`
			);
		}
		console.log("");
		return;
	}

	console.log("✓");

	if (
		validationResult.warnings.length > 0
	) {
		console.log("");
		for (
			const warning
			of validationResult.warnings
		) {
			console.log(
				`- ${warning}`
			);
		}
	}

	saveGenerationResult(
		generationResult,
		providerName
	);

	console.log("");
	printGenerationSummary(
		config.project.name,
		hld.source,
		document
	);

	const approval =
		await askForCreationApproval();

	if (!approval) {
		console.log("");
		console.log(
			"Workflow stopped. Nothing was created in Jira."
		);
		console.log("");
		return;
	}

	if (!config.jira.enabled) {
		console.log("");
		console.log(
			"Jira integration is disabled. Generation result is saved locally."
		);
		console.log("");
		return;
	}

	if (!selectedProjectKey) {
		throw new Error(
			"Jira project selection is required."
		);
	}

	await createInJira(
		config.jira.provider,
		selectedProjectKey,
		document
	);

	console.log("");
	console.log(
		"StoryCraft completed successfully."
	);
	console.log(
		`Jira project: ${selectedProjectKey}`
	);
	console.log(
		`Created: ${document.epics.length} Epics, ${document.stories.length} Stories, ${document.tasks.length} Tasks`
	);
	console.log(
		"Execution result: .sdlc/storycraft/jira-result.json"
	);
	console.log("");
}


// ==================================================
// CONTINUE
// ==================================================

export async function continueStoryCraft():
	Promise<void> {
	console.log("");
	console.log(
		"StoryCraft now runs end-to-end from 'sdlc storycraft start'."
	);
	console.log("");
}


// ==================================================
// WORKFLOW (LEGACY ALIAS)
// ==================================================

export async function runStoryCraftWorkflow():
	Promise<void> {
	await startStoryCraft();
}


// ==================================================
// REVIEW
// ==================================================

export async function reviewStories():
	Promise<void> {
	const storiesPath =
		getStoriesPath();

	if (!fs.existsSync(storiesPath)) {
		console.log("");
		console.log(
			"stories.json not found."
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
		JSON.parse(content) as StoryCraftGenerationDocument;

	console.log("");
	console.log(
		"StoryCraft Human Review"
	);
	console.log(
		"======================="
	);
	console.log("");

	console.log(
		`Epics: ${data.epics.length}`
	);
	console.log(
		`Stories: ${data.stories.length}`
	);
	console.log(
		`Tasks: ${data.tasks.length}`
	);
	console.log("");

	const approved =
		await confirm({
			message:
				"Approve generated StoryCraft output?",
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

	const result =
		validateReview();

	console.log("");
	console.log(result.message);
	console.log(
		"Review result saved to .sdlc/storycraft/review.json"
	);
	console.log("");
}


// ==================================================
// HELPER: SAVE GENERATION
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

	const output =
		toGenerationDocument(
			generationResult,
			generatedBy
		);

	fs.writeFileSync(
		getStoriesPath(),
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

	fs.writeFileSync(
		path.join(
			storycraftPath,
			"story-graph.json"
		),
		JSON.stringify(
			graph,
			null,
			2
		),
		"utf8"
	);
}


// ==================================================
// HELPER: DOCUMENT
// ==================================================

function toGenerationDocument(
	generationResult: StoryGenerationResult,
	generatedBy: string
): StoryCraftGenerationDocument {
	return {
		version:
			"1.0",
		generatedBy,
		epics:
			generationResult.epics,
		stories:
			generationResult.stories,
		tasks:
			generationResult.tasks
	};
}


// ==================================================
// HELPER: SUMMARY
// ==================================================

function printGenerationSummary(
	projectName: string,
	hldSource: string,
	document: StoryCraftGenerationDocument
): void {
	console.log(
		"StoryCraft Generation Summary"
	);
	console.log("");
	console.log(
		`Project: ${projectName}`
	);
	console.log(
		`HLD: ${hldSource}`
	);
	console.log(
		`Epics: ${document.epics.length}`
	);
	console.log(
		`Stories: ${document.stories.length}`
	);
	console.log(
		`Tasks: ${document.tasks.length}`
	);
	console.log("");

	for (
		const epic
		of document.epics
	) {
		console.log(
			`${epic.id} ${epic.title}`
		);

		const stories =
			document.stories.filter(
				(
					story
				) =>
					story.epicId === epic.id
			);

		for (
			const story
			of stories
		) {
			console.log(
				`  ${story.id} ${story.title}`
			);

			const tasks =
				document.tasks.filter(
					(
						task
					) =>
						task.storyId === story.id
				);

			for (
				const task
				of tasks
			) {
				console.log(
					`    ${task.id} ${task.title}`
				);
			}
		}

		console.log("");
	}
}


// ==================================================
// HELPER: APPROVAL
// ==================================================

async function askForCreationApproval():
	Promise<boolean> {
	while (true) {
		const answer =
			(
				await input({
					message:
						"Create these Epics, Stories and Tasks in Jira? (y/n)",
					default:
						"n"
				})
			)
				.trim()
				.toLowerCase();

		if (answer === "y") {
			return true;
		}

		if (answer === "n") {
			return false;
		}

		console.log(
			"Please answer with 'y' or 'n'."
		);
	}
}


// ==================================================
// HELPER: JIRA CREATION
// ==================================================

async function createInJira(
	providerName: string,
	projectKey: string,
	document: StoryCraftGenerationDocument
): Promise<void> {

	const resultPath =
		path.join(
			process.cwd(),
			".sdlc",
			"storycraft",
			"jira-result.json"
		);

	if (fs.existsSync(resultPath)) {
		const existing =
			JSON.parse(
				fs.readFileSync(
					resultPath,
					"utf8"
				)
			) as JiraCreationResult;

		if (
			existing.status === "completed" &&
			existing.projectKey === projectKey
		) {
			throw new Error(
				"Jira creation was already completed for this project. Remove .sdlc/storycraft/jira-result.json only if you explicitly want to rerun."
			);
		}
	}

	const jira =
		createJiraProvider(
			providerName
		);

	const result: JiraCreationResult = {
		version:
			"1.0",
		status:
			"in_progress",
		projectKey,
		createdAt:
			new Date().toISOString(),
		epics:
			[],
		stories:
			[],
		tasks:
			[],
		errors:
			[]
	};

	writeJiraResult(
		resultPath,
		result
	);

	const epicKeyByStoryCraftId =
		new Map<string, string>();

	const storyKeyByStoryCraftId =
		new Map<string, string>();

	try {
		console.log("");
		console.log("Creating Jira Epics...");

		for (
			const epic
			of document.epics
		) {
			const createdEpic =
				await jira.createEpic(
					projectKey,
					epic.title,
					epic.description
				);

			result.epics.push({
				storyCraftId:
					epic.id,
				jiraKey:
					createdEpic.key
			});

			epicKeyByStoryCraftId.set(
				epic.id,
				createdEpic.key
			);

			writeJiraResult(
				resultPath,
				result
			);

			console.log(
				`✓ ${createdEpic.key}`
			);
		}

		console.log("");
		console.log("Creating Jira Stories...");

		for (
			const story
			of document.stories
		) {
			const jiraEpicKey =
				epicKeyByStoryCraftId.get(
					story.epicId
				);

			if (!jiraEpicKey) {
				throw new Error(
					`Cannot create story ${story.id}. Epic ${story.epicId} was not created.`
				);
			}

			const createdStory =
				await jira.createStory(
					projectKey,
					jiraEpicKey,
					story.title,
					buildJiraStoryDescription(
						story
					)
				);

			result.stories.push({
				storyCraftId:
					story.id,
				jiraKey:
					createdStory.key
			});

			storyKeyByStoryCraftId.set(
				story.id,
				createdStory.key
			);

			writeJiraResult(
				resultPath,
				result
			);

			console.log(
				`✓ ${createdStory.key}`
			);
		}

		console.log("");
		console.log("Creating Jira Tasks...");

		for (
			const task
			of document.tasks
		) {
			const jiraStoryKey =
				storyKeyByStoryCraftId.get(
					task.storyId
				);

			if (!jiraStoryKey) {
				throw new Error(
					`Cannot create task ${task.id}. Story ${task.storyId} was not created.`
				);
			}

			const createdTask =
				await jira.createTask(
					projectKey,
					jiraStoryKey,
					task.title,
					buildJiraTaskDescription(
						task
					)
				);

			result.tasks.push({
				storyCraftId:
					task.id,
				jiraKey:
					createdTask.key
			});

			writeJiraResult(
				resultPath,
				result
			);

			console.log(
				`✓ ${createdTask.key}`
			);
		}

		result.status =
			"completed";
		result.completedAt =
			new Date().toISOString();
		writeJiraResult(
			resultPath,
			result
		);

	} catch (error) {
		result.status =
			"failed";
		result.completedAt =
			new Date().toISOString();

		result.errors.push(
			error instanceof Error
				? error.message
				: String(error)
		);

		writeJiraResult(
			resultPath,
			result
		);

		throw new Error(
			[
				"Jira creation failed.",
				`Created so far: ${result.epics.length} epics, ${result.stories.length} stories, ${result.tasks.length} tasks.`,
				"See .sdlc/storycraft/jira-result.json"
			].join("\n")
		);
	}
}


// ==================================================
// HELPER: JIRA RESULT
// ==================================================

function writeJiraResult(
	resultPath: string,
	result: JiraCreationResult
): void {
	fs.writeFileSync(
		resultPath,
		JSON.stringify(
			result,
			null,
			2
		),
		"utf8"
	);
}


// ==================================================
// HELPER: JIRA DESCRIPTION
// ==================================================

function buildJiraStoryDescription(
	story: {
		id: string;
		description: string;
		businessValue: string;
		acceptanceCriteria: string[];
		technicalRequirements: string[];
		dependencies: string[];
		hldReferences: string[];
		estimate: {
			storyPoints: number;
		};
	}
): string {
	const acceptanceCriteria =
		story.acceptanceCriteria
			.map(
				(
					criterion
				) =>
					`- ${criterion}`
			)
			.join("\n");

	const technicalRequirements =
		story.technicalRequirements
			.map(
				(
					requirement
				) =>
					`- ${requirement}`
			)
			.join("\n");

	const dependencies =
		story.dependencies.length > 0
			? story.dependencies
					.map(
						(
							dependency
						) =>
							`- ${dependency}`
					)
					.join("\n")
			: "- None";

	const hldReferences =
		story.hldReferences.length > 0
			? story.hldReferences
					.map(
						(
							reference
						) =>
							`- ${reference}`
					)
					.join("\n")
			: "- None";

	return `StoryCraft ID: ${story.id}\n\nDescription:\n${story.description}\n\nBusiness Value:\n${story.businessValue}\n\nAcceptance Criteria:\n${acceptanceCriteria}\n\nTechnical Requirements:\n${technicalRequirements}\n\nDependencies:\n${dependencies}\n\nHLD References:\n${hldReferences}\n\nStory Points: ${story.estimate.storyPoints}`;
}

function buildJiraTaskDescription(
	task: {
		id: string;
		description: string;
		technicalDetails: string[];
		dependencies: string[];
		estimate: {
			hours: number;
		};
	}
): string {
	const technicalDetails =
		task.technicalDetails
			.map(
				(
					detail
				) =>
					`- ${detail}`
			)
			.join("\n");

	const dependencies =
		task.dependencies.length > 0
			? task.dependencies
					.map(
						(
							dependency
						) =>
							`- ${dependency}`
					)
					.join("\n")
			: "- None";

	return `StoryCraft ID: ${task.id}\n\nDescription:\n${task.description}\n\nTechnical Details:\n${technicalDetails}\n\nDependencies:\n${dependencies}\n\nEstimate (hours): ${task.estimate.hours}`;
}


// ==================================================
// HELPER: COPILOT FILES
// ==================================================

function createCopilotFiles(
	projectRoot: string
): void {
	const githubDirectory =
		path.join(
			projectRoot,
			".github"
		);

	const promptsDirectory =
		path.join(
			githubDirectory,
			"prompts"
		);

	fs.mkdirSync(
		promptsDirectory,
		{
			recursive: true
		}
	);

	const copilotInstructionsPath =
		path.join(
			githubDirectory,
			"copilot-instructions.md"
		);

	if (!fs.existsSync(copilotInstructionsPath)) {
		fs.writeFileSync(
			copilotInstructionsPath,
			createCopilotInstructions(),
			"utf8"
		);
	}

	const promptPath =
		path.join(
			promptsDirectory,
			"sdlc-storycraft-start.prompt.md"
		);

	if (!fs.existsSync(promptPath)) {
		fs.writeFileSync(
			promptPath,
			createSlashPromptFile(),
			"utf8"
		);
	}

	const aliasPromptPath =
		path.join(
			promptsDirectory,
			"sdlc-start-workflow.prompt.md"
		);

	if (!fs.existsSync(aliasPromptPath)) {
		fs.writeFileSync(
			aliasPromptPath,
			createSlashPromptFile(),
			"utf8"
		);
	}

	const aiPromptPath =
		path.join(
			promptsDirectory,
			"sdlc-storycraft-generate.prompt.md"
		);

	if (!fs.existsSync(aiPromptPath)) {
		fs.writeFileSync(
			aiPromptPath,
			createAIGenerationSlashPromptFile(),
			"utf8"
		);
	}
}


function createCopilotInstructions():
	string {

	return `# StoryCraft Developer Instructions

This project uses StoryCraft SDLC automation.

Primary workflow:

1. Run /sdlc-storycraft-start in Copilot Chat.
2. Execute the StoryCraft CLI workflow.
3. Keep generation grounded in real project context and HLD.
4. Do not invent unrelated demo requirements.
5. Never create Jira items without explicit human approval.
`;
}


function createSlashPromptFile():
	string {

	return `---
mode: agent
description: Start the StoryCraft SDLC workflow
---

Run the StoryCraft workflow for this project now.

Steps:

1. Run: sdlc storycraft start
2. Follow the interactive prompts.
3. Do not bypass human approval before Jira creation.
4. If creation is rejected, stop without creating Jira items.
`;
}


function createAIGenerationSlashPromptFile():
	string {

	return `---
mode: agent
description: Generate StoryCraft AI JSON and save it
---

Run the StoryCraft AI handoff task for this project.

Steps:

1. Read .sdlc/storycraft/ai-prompt.md
2. Generate the StoryCraft JSON response from real project context/HLD.
3. Save ONLY JSON to .sdlc/storycraft/ai-response.json
4. Do not include markdown fences.
5. Confirm when the file is saved.
`;
}


function createStoryCraftEnvTemplate(
	projectRoot: string
): void {
	const envTemplatePath =
		path.join(
			projectRoot,
			".env.storycraft.example"
		);

	if (fs.existsSync(envTemplatePath)) {
		return;
	}

	fs.writeFileSync(
		envTemplatePath,
		createEnvTemplateContent(),
		"utf8"
	);
}


function createEnvTemplateContent():
	string {

	return `# StoryCraft integration environment variables
# Copy this file to .env and update with your real values.

# Jira
export JIRA_BASE_URL="https://your-company.atlassian.net"
export JIRA_EMAIL="your-email@company.com"
export JIRA_API_TOKEN="your-jira-api-token"

# Confluence
export CONFLUENCE_BASE_URL="https://your-company.atlassian.net"
export CONFLUENCE_EMAIL="your-email@company.com"
export CONFLUENCE_API_TOKEN="your-confluence-api-token"
export CONFLUENCE_HLD_PAGE_ID="your-confluence-hld-page-id"

# AI (required when using direct Claude mode)
export ANTHROPIC_API_KEY="your-anthropic-api-key"
export ANTHROPIC_MODEL="claude-3-5-sonnet-latest"
`;
}


// ==================================================
// HELPER: CONTEXT WITH LOADED HLD
// ==================================================

function withLoadedHld(
	context: StoryCraftContext,
	source: string,
	content: string
): StoryCraftContext {
	return {
		...context,
		hld: {
			source,
			exists: true,
			available: true,
			isPlaceholder: false,
			data: {
				source,
				content
			}
		}
	};
}


// ==================================================
// HELPER: PATHS
// ==================================================

function getStoriesPath():
	string {
	return path.join(
		process.cwd(),
		".sdlc",
		"storycraft",
		"stories.json"
	);
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
