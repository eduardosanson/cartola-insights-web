// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

const path = (name: string) => resolve(process.cwd(), ".github", "workflows", name);
const workflowPath = path("pre-merge-manual.yml");
const read = () => readFileSync(workflowPath, "utf8");

describe("Pre-merge manual workflow (issue #30)", () => {
  it("exists", () => {
    expect(existsSync(workflowPath)).toBe(true);
  });

  it("is triggered only by workflow_dispatch with a required pr_number input (RF01)", () => {
    const content = read();
    expect(content).toContain("workflow_dispatch:");
    expect(content).toContain("pr_number:");
    expect(content).toContain("required: true");
    expect(content).not.toContain("pull_request:");
    expect(content).not.toMatch(/^\s*push:/m);
  });

  it("uses least-privilege permissions (RNF01)", () => {
    const content = read();
    expect(content).toContain("contents: read");
    expect(content).toContain("pull-requests: read");
    expect(content).toContain("statuses: write");
    expect(content).not.toContain("write-all");
  });

  it("resolves the PR via gh pr view and rejects closed or fork PRs (RF02)", () => {
    const content = read();
    expect(content).toContain("gh pr view");
    expect(content).toContain("headRefOid");
    expect(content).toContain("isCrossRepository");
    expect(content).toContain("OPEN");
  });

  it("checks out the PR SHA without persisting credentials (RF02, RNF01)", () => {
    const content = read();
    expect(content).toContain("actions/checkout@v4");
    expect(content).toContain("ref: ${{ steps.pr.outputs.sha }}");
    expect(content).toContain("persist-credentials: false");
  });

  it("never interpolates the user input directly into a run script (injection)", () => {
    const runs = read().match(/run: [\s\S]*?(?=\n\s+- |\n\s+\w+:\s*$|$)/g) ?? [];
    expect(runs.join("\n")).not.toContain("${{ inputs.pr_number }}");
  });

  it("runs install, lint, build, vitest and playwright, without mutation (RF03, RNF02)", () => {
    const content = read();
    expect(content).toContain("run: npm ci");
    expect(content).toContain("run: npm run lint");
    expect(content).toContain("run: npm run build");
    expect(content).toContain("npm test -- --run");
    expect(content).toContain("npx playwright install --with-deps chromium");
    expect(content).toContain("run: npm run test:e2e");
    expect(content).not.toContain("test:mutation");
  });

  it("publishes pending then success/failure as pre-merge-manual with a target_url (RF04)", () => {
    const content = read();
    expect(content).toContain("pre-merge-manual");
    expect(content).toContain("state=pending");
    expect(content).toContain("state=success");
    expect(content).toContain("state=failure");
    expect(content).toContain("target_url");
    expect(content).toContain("if: success()");
    expect(content).toContain("if: failure()");
  });

  it("does not publish a final status when cancelled by a newer run (CA04)", () => {
    expect(read()).not.toContain("if: always()");
  });

  it("serializes runs per PR cancelling older ones (RF05)", () => {
    const content = read();
    expect(content).toContain("concurrency:");
    expect(content).toContain("pre-merge-manual-${{ inputs.pr_number }}");
    expect(content).toContain("cancel-in-progress: true");
  });

  it("leaves ci.yml behavior untouched (RNF03)", () => {
    const ci = readFileSync(path("ci.yml"), "utf8");
    expect(ci).toContain("test:mutation");
    expect(ci).not.toContain("workflow_dispatch");
  });

  it("is documented in the README (RF06)", () => {
    const readme = readFileSync(resolve(process.cwd(), "README.md"), "utf8");
    expect(readme).toContain("pre-merge-manual");
    expect(readme).toContain("workflow_dispatch");
  });
});
