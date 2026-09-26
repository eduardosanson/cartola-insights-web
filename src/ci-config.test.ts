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

  it("should use actions/checkout@v4 and actions/setup-node@v4 with Node 24 and npm cache", () => {
    const content = readFileSync(workflowPath, "utf8");
    expect(content).toContain("actions/checkout@v4");
    expect(content).toContain("actions/setup-node@v4");
    // Node 24 (issue #11): @stryker-mutator/core exige engines.node >= 22.
    expect(content).toContain("node-version: 24");
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

  it("should install Playwright's Chromium browser and run the e2e suite as a blocking gate (issue #6)", () => {
    const content = readFileSync(workflowPath, "utf8");
    expect(content).toContain("npx playwright install --with-deps chromium");
    expect(content).toContain("run: npm run test:e2e");
  });

  it("should upload the Playwright report and test results as an artifact when the job fails (issue #6)", () => {
    const content = readFileSync(workflowPath, "utf8");
    expect(content).toContain("actions/upload-artifact@v4");
    expect(content).toContain("if: failure()");
    expect(content).toContain("playwright-report/");
    expect(content).toContain("test-results/");
  });

  it("runs mutation testing as a blocking step and uploads the HTML report as an artifact (issue #11)", () => {
    const content = readFileSync(workflowPath, "utf8");
    expect(content).toContain("run: NODE_ENV=test npm run test:mutation");
    // Bloqueante: nenhum step usa continue-on-error, então uma falha do
    // Stryker (score abaixo do threshold) derruba o job normalmente.
    expect(content).not.toContain("continue-on-error");
    expect(content).toContain("actions/upload-artifact@v4");
    expect(content).toContain("mutation-report");
    expect(content).toContain("reports/mutation/html");
  });

  describe("Branch Up-to-Date Check (issue #44)", () => {
    const branchUpToDatePath = resolve(
      process.cwd(),
      ".github",
      "workflows",
      "branch-up-to-date.yml"
    );

    it("should have branch-up-to-date.yml file", () => {
      expect(existsSync(branchUpToDatePath)).toBe(true);
    });

    it("should trigger on pull_request and push to main branch (RF02)", () => {
      const content = readFileSync(branchUpToDatePath, "utf8");
      expect(content).toContain("pull_request:");
      expect(content).toContain("push:");
      expect(content).toContain("branches: [main]");
    });

    it("should check if branch is up to date with main (RF01)", () => {
      const content = readFileSync(branchUpToDatePath, "utf8");
      expect(content).toContain("git fetch origin main");
      expect(content).toContain("merge-base");
      expect(content).toContain("origin/main");
    });

    it("should fail the check if branch is behind main", () => {
      const content = readFileSync(branchUpToDatePath, "utf8");
      expect(content).toContain("exit 1");
    });

    it("should checkout PR head sha to prevent false positives from synthetic merge commits", () => {
      const content = readFileSync(branchUpToDatePath, "utf8");
      expect(content).toContain("github.event.pull_request.head.sha");
    });

    it("should report missing commit count and remediation instructions on failure", () => {
      const content = readFileSync(branchUpToDatePath, "utf8");
      expect(content).toContain("git rev-list --count");
      expect(content).toContain("git merge origin/main");
    });
  });
});
