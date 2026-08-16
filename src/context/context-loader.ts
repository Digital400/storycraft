import fs from "node:fs";
import path from "node:path";

export interface StoryCraftContext {
  problem: unknown;
  solution: unknown;
  hld: unknown;
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
): unknown {
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Context file not found: ${fileName}`
    );
  }

  const content = fs.readFileSync(
    filePath,
    "utf8"
  );

  try {
    return JSON.parse(content);
  } catch {
    throw new Error(
      `Invalid JSON in context file: ${fileName}`
    );
  }
}