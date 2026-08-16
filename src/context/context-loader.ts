import fs from "node:fs";
import path from "node:path";

export interface ContextResource {
  source: string;
  exists: boolean;
  available: boolean;
  isPlaceholder: boolean;
  data: unknown;
}

export interface StoryCraftContext {
  problem: ContextResource;
  solution: ContextResource;
  hld: ContextResource;
}

export function loadContext(): StoryCraftContext {
  const contextPath = path.join(
    process.cwd(),
    ".sdlc",
    "context"
  );

  const problem = readJsonFile(
    path.join(contextPath, "problem.json"),
    "problem.json"
  );

  const solution = readJsonFile(
    path.join(contextPath, "solution.json"),
    "solution.json"
  );

  const hld = readJsonFile(
    path.join(contextPath, "hld.json"),
    "hld.json"
  );

  return {
    problem,
    solution,
    hld
  };
}

function readJsonFile(
  filePath: string,
  fileName: string
): ContextResource {
  const source = path.join(
    ".sdlc",
    "context",
    fileName
  );

  if (!fs.existsSync(filePath)) {
    return {
      source,
      exists: false,
      available: false,
      isPlaceholder: true,
      data: null
    };
  }

  const content = fs.readFileSync(
    filePath,
    "utf8"
  );

  try {
    const data = JSON.parse(content);
    const isPlaceholder =
      isObject(data) &&
      data.status === "not_available";

    return {
      source,
      exists: true,
      available: !isPlaceholder,
      isPlaceholder,
      data
    };
  } catch {
    throw new Error(
      `Invalid JSON in context file: ${fileName}`
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