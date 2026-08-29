// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

describe("CI GitHub Actions Configuration", () => {
  const workflowPath = resolve(
    process.cwd(),
    ".github",
    "workflows",
    "ci.yml"
  );

  it("should have ci.yml file", () => {
    expect(existsSync(workflowPath)).toBe(true);
  });

  it("should trigger on push and pull_request to main branch", () => {
    const content = readFileSync(workflowPath, "utf8");
    expect(content).toContain("push:");
    expect(content).toContain("pull_request:");
    expect(content).toContain("branches: [main]");
  });

  it("should use actions/checkout@v4 and actions/setup-node@v4 with Node 20 and npm cache", () => {
    const content = readFileSync(workflowPath, "utf8");
    expect(content).toContain("actions/checkout@v4");
    expect(content).toContain("actions/setup-node@v4");
    expect(content).toContain("node-version: 20");
    expect(content).toContain("cache: npm");
  });

  it("should restrict the workflow token to read-only contents (least privilege)", () => {
    const content = readFileSync(workflowPath, "utf8");
    expect(content).toContain("permissions:");
    expect(content).toContain("contents: read");
  });

  it("should run all required validation steps: npm ci, lint, production build, and test with coverage", () => {
    const content = readFileSync(workflowPath, "utf8");
    expect(content).toContain("run: npm ci");
    expect(content).toContain("run: npm run lint");
    expect(content).toContain("run: npm run build");
    expect(content).toContain("npm test -- --run --coverage");
  });

  it("should scope NODE_ENV=test to the test/coverage step only, not the job (so it never leaks into the Vite production build)", () => {
    const content = readFileSync(workflowPath, "utf8");
    const jobHeader = content.split(/^\s*steps:/m)[0];
    expect(jobHeader).not.toContain("NODE_ENV");
    expect(content).toContain("run: NODE_ENV=test npm test -- --run --coverage");
  });

  it("should run the real Vite production build instead of a standalone typecheck", () => {
    const content = readFileSync(workflowPath, "utf8");
    expect(content).not.toContain("run: npx tsc -b");
  });
});
