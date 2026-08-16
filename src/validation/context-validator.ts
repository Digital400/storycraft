import { StoryCraftContext } from "../context/context-loader.js";

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

  validateProblem(context.problem, errors);
  validateSolution(context.solution, errors);
  validateHld(context.hld, errors);

  return {
    passed: errors.length === 0,
    errors,
    warnings
  };
}

function validateProblem(
  problem: unknown,
  errors: string[]
): void {
  if (!isObject(problem)) {
    errors.push("Problem context is invalid.");
    return;
  }

  if (problem.status === "not_available") {
    errors.push(
      "Problem Discovery has not been completed."
    );
  }

  if (
    isObject(problem.problem) &&
    typeof problem.problem.statement === "string" &&
    !problem.problem.statement.trim()
  ) {
    errors.push(
      "Problem statement is missing."
    );
  }
}

function validateSolution(
  solution: unknown,
  errors: string[]
): void {
  if (!isObject(solution)) {
    errors.push("Solution context is invalid.");
    return;
  }

  if (solution.status === "not_available") {
    errors.push(
      "Solution Discovery has not been completed."
    );
  }

  if (
    isObject(solution.solution) &&
    typeof solution.solution.description === "string" &&
    !solution.solution.description.trim()
  ) {
    errors.push(
      "Solution description is missing."
    );
  }
}

function validateHld(
  hld: unknown,
  errors: string[]
): void {
  if (!isObject(hld)) {
    errors.push("HLD context is invalid.");
    return;
  }

  if (hld.status === "not_available") {
    errors.push(
      "HLD has not been completed."
    );
  }

  if (
    isObject(hld.hld) &&
    typeof hld.hld.description === "string" &&
    !hld.hld.description.trim()
  ) {
    errors.push(
      "HLD description is missing."
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