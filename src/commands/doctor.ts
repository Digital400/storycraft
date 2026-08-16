import fs from "node:fs";
import path from "node:path";
import { loadConfig } from "../config.js";

export function runDoctor(): void {
  console.log("");
  console.log("StoryCraft Doctor");
  console.log("-----------------");

  const sdlcPath = path.join(process.cwd(), ".sdlc");
  const configPath = path.join(sdlcPath, "config.yaml");

  let hasErrors = false;

  // Check .sdlc directory
  if (fs.existsSync(sdlcPath)) {
    console.log("✓ .sdlc directory exists");
  } else {
    console.log("✗ .sdlc directory not found");
    hasErrors = true;
  }

  // Check config.yaml
  if (fs.existsSync(configPath)) {
    console.log("✓ config.yaml exists");
  } else {
    console.log("✗ config.yaml not found");
    hasErrors = true;
  }

  if (hasErrors) {
    console.log("");
    console.log("StoryCraft project is not initialized.");
    console.log("Run: sdlc storycraft init");
    return;
  }

  // Load configuration
  let config;

  try {
    config = loadConfig();
    console.log("✓ config.yaml is valid");
  } catch (error) {
    console.log("✗ config.yaml could not be loaded");
    console.log("");

    if (error instanceof Error) {
      console.log(error.message);
    }

    return;
  }

  // Project name
  if (config.project.name.trim()) {
    console.log("✓ project name configured");
  } else {
    console.log("✗ project name is missing");
    hasErrors = true;
  }

  // AI provider
  if (config.ai.provider.trim()) {
    console.log(`✓ AI provider: ${config.ai.provider}`);
  } else {
    console.log("✗ AI provider is missing");
    hasErrors = true;
  }

  // HLD provider
  if (config.resources.hld.provider.trim()) {
    console.log(`✓ HLD provider: ${config.resources.hld.provider}`);
  } else {
    console.log("✗ HLD provider is missing");
    hasErrors = true;
  }

  // Human review
  if (config.storycraft.require_human_review) {
    console.log("✓ human review is enabled");
  } else {
    console.log("⚠ human review is disabled");
  }

  console.log("");

  if (hasErrors) {
    console.log("StoryCraft Doctor found configuration problems.");
  } else {
    console.log("StoryCraft project is healthy.");
  }

  console.log("");
}