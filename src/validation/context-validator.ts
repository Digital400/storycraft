import {
  StoryCraftContext,
  ContextResource
} from "../context/context-loader.js";

export interface ContextValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

export function validateContext(
  context: StoryCraftContext
): ContextValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  validateProblem(context.problem, warnings);
  validateSolution(context.solution, warnings);
  validateHld(context.hld, warnings);

  const hasProblem =
    context.problem.available;

  const hasSolution =
    context.solution.available;

  const hasHld =
    context.hld.available;

  if (!hasHld) {
    errors.push(
      "HLD source is missing or marked not_available. Configure Confluence HLD or provide local HLD content."
    );
  }

  if (!hasProblem && !hasSolution) {
    warnings.push(
      "Problem and solution context are placeholders. StoryCraft will continue using discovered project files and HLD."
    );
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings
  };
}

function validateProblem(
  problem: ContextResource,
  warnings: string[]
): void {
  if (!problem.exists) {
    warnings.push("problem.json is missing.");
    return;
  }

  if (problem.isPlaceholder) {
    warnings.push("Problem context is a placeholder.");
    return;
  }

  const data = problem.data;

  if (
    isObject(data) &&
    isObject(data.problem) &&
    typeof data.problem.statement === "string" &&
    !data.problem.statement.trim()
  ) {
    warnings.push(
      "Problem statement is empty."
    );
  }
}

function validateSolution(
  solution: ContextResource,
  warnings: string[]
): void {
  if (!solution.exists) {
    warnings.push("solution.json is missing.");
    return;
  }

  if (solution.isPlaceholder) {
    warnings.push("Solution context is a placeholder.");
    return;
  }

  const data = solution.data;

  if (
    isObject(data) &&
    isObject(data.solution) &&
    typeof data.solution.description === "string" &&
    !data.solution.description.trim()
  ) {
    warnings.push(
      "Solution description is empty."
    );
  }
}

function validateHld(
  hld: ContextResource,
  warnings: string[]
): void {
  if (!hld.exists) {
    warnings.push("hld.json is missing.");
    return;
  }

  if (hld.isPlaceholder) {
    warnings.push("Local HLD context is a placeholder.");
    return;
  }

  const data = hld.data;

  if (
    isObject(data) &&
    isObject(data.hld) &&
    typeof data.hld.description === "string" &&
    !data.hld.description.trim()
  ) {
    warnings.push(
      "Local HLD description is empty."
    );
  }
}

function isObject(
  value: unknown
): value is Record<string, any> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}