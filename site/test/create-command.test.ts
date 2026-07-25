import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

import {
  createCommandTokens,
  createPosixCommand,
  createPowerShellCommand,
  getDescriptionValidationMessage,
  getDestinationValidationMessage,
  getGithubOwnerValidationMessage,
  inferProjectName,
  parseConfigurationHash,
  quotePowerShellToken,
  quotePosixShellToken,
  serializeConfigurationHash,
} from "../src/create-command";

const executeFile = promisify(execFile);
const require = createRequire(import.meta.url);
const createAstilbaPackagePath = require.resolve("create-astilba/package.json");
const createAstilbaExecutable = join(
  createAstilbaPackagePath,
  "..",
  "dist",
  "bin.js"
);

const configuration = {
  description: "A useful application.",
  destination: "my-project",
  githubOwner: "example",
  initializeGit: true,
  installDependencies: true,
  recipe: "react-vite-spa",
} as const;
const release = {
  generatorVersion: "0.3.0",
  recipeVersion: 2,
} as const;
const recipeVersions = new Map([
  ["typescript-library", 2],
  ["react-vite-spa", 2],
  ["astro-static-site", 2],
  ["cloudflare-worker-service", 2],
]);

describe("Create command presentation", () => {
  it("builds a fixed argv sequence with explicit setup choices", () => {
    expect(createCommandTokens(configuration, "0.3.0")).toEqual([
      "npm",
      "create",
      "astilba@0.3.0",
      "--",
      "--recipe=react-vite-spa",
      "--description=A useful application.",
      "--github-owner=example",
      "--git",
      "--install",
      "--",
      "my-project",
    ]);
  });

  it.each([
    "",
    "plain",
    "a path/project",
    "it's quoted",
    '"double quotes"',
    "$(touch nope)",
    "`touch nope`",
    "semi;colon",
    "ampersand&value",
    "glob*value",
    "<script>alert(1)</script>",
  ])("round-trips an adversarial POSIX shell token: %s", async (value) => {
    const { stdout } = await executeFile(
      "/bin/sh",
      ["-c", `printf '%s' ${quotePosixShellToken(value)}`],
      { encoding: "utf8", timeout: 2000 }
    );

    expect(stdout).toBe(value);
  });

  it("renders a safely quoted command without interpreting input as markup", () => {
    expect(
      createPosixCommand(
        {
          ...configuration,
          description: "It's $(not code); <script>alert(1)</script>",
          destination: "projects/my app",
        },
        "0.3.0"
      )
    ).toBe(
      "npm create astilba@0.3.0 -- --recipe=react-vite-spa '--description=It'\"'\"'s $(not code); <script>alert(1)</script>' --github-owner=example --git --install -- 'projects/my app'"
    );
  });

  it("renders the same argv for PowerShell with literal single-quote escaping", () => {
    expect(
      createPowerShellCommand(
        {
          ...configuration,
          description: "It's $(not code); <script>alert(1)</script>",
          destination: "projects/my app",
        },
        "0.3.0"
      )
    ).toBe(
      "npm create astilba@0.3.0 -- '--recipe=react-vite-spa' '--description=It''s $(not code); <script>alert(1)</script>' '--github-owner=example' --git --install -- 'projects/my app'"
    );
    expect(quotePowerShellToken("plain")).toBe("'plain'");
    expect(quotePowerShellToken("@args")).toBe("'@args'");
    expect(quotePowerShellToken("--%")).toBe("'--%'");
  });

  it("keeps a leading-dash description attached to its option", () => {
    expect(
      createCommandTokens(
        { ...configuration, description: "-not-an-option" },
        "0.3.0"
      )
    ).toContain("--description=-not-an-option");
  });

  it("is accepted by the installed Create parser", async () => {
    const directory = await mkdtemp(join(tmpdir(), "astilba-docs-create-"));
    const tokens = createCommandTokens(configuration, "0.3.0");
    const firstSeparator = tokens.indexOf("--");
    const lastSeparator = tokens.lastIndexOf("--");

    expect(firstSeparator).toBeGreaterThan(-1);
    expect(lastSeparator).toBeGreaterThan(firstSeparator);

    const cliArguments = [
      ...tokens.slice(firstSeparator + 1, lastSeparator),
      "--dry-run",
      "--json",
      ...tokens.slice(lastSeparator),
    ];

    try {
      const { stdout } = await executeFile(
        process.execPath,
        [createAstilbaExecutable, ...cliArguments],
        { cwd: directory, encoding: "utf8", timeout: 10_000 }
      );
      const result = JSON.parse(stdout) as {
        readonly ok: boolean;
        readonly recipe: string;
        readonly schemaVersion: number;
      };

      expect(result).toMatchObject({
        ok: true,
        recipe: configuration.recipe,
        schemaVersion: 1,
      });
    } finally {
      await rm(directory, { recursive: true });
    }
  });

  it.each(["my-project", "projects/my app", "a/portable-path"])(
    "accepts a portable destination: %s",
    (destination) => {
      expect(getDestinationValidationMessage(destination)).toBeUndefined();
    }
  );

  it("infers the same project name used by destination validation", () => {
    expect(inferProjectName("projects/My useful app")).toBe("my-useful-app");
    expect(inferProjectName("projects/---")).toBe("");
  });

  it.each([
    "",
    "../project",
    "project/..",
    "/absolute",
    String.raw`C:\project`,
    "project/.git",
    "CON",
    "project.",
    "project ",
    "café",
    "a".repeat(181),
  ])("rejects a non-portable destination: %s", (destination) => {
    expect(getDestinationValidationMessage(destination)).toBeDefined();
  });

  it.each(["A useful application.", "-not-an-option", "文".repeat(280)])(
    "accepts a valid description",
    (description) => {
      expect(getDescriptionValidationMessage(description)).toBeUndefined();
    }
  );

  it.each([
    "",
    " leading",
    "trailing ",
    "line\nbreak",
    "visually\u202Ereordered",
    "zero\u200Dwidth",
    "x".repeat(281),
  ])("rejects an invalid description", (description) => {
    expect(getDescriptionValidationMessage(description)).toBeDefined();
  });

  it.each(["example", "a", "example-owner", "a".repeat(39)])(
    "accepts a valid GitHub owner: %s",
    (owner) => {
      expect(getGithubOwnerValidationMessage(owner)).toBeUndefined();
    }
  );

  it.each(["", "-owner", "owner-", "foo_", "a".repeat(40), " owner"])(
    "rejects an invalid GitHub owner: %s",
    (owner) => {
      expect(getGithubOwnerValidationMessage(owner)).toBeDefined();
    }
  );

  it("round-trips the largest supported multibyte description", () => {
    const multibyteConfiguration = {
      ...configuration,
      description: "文".repeat(280),
    };
    const hash = serializeConfigurationHash(
      multibyteConfiguration,
      release,
      "posix"
    );

    expect(hash.length).toBeGreaterThan(2048);
    expect(
      parseConfigurationHash(hash, recipeVersions, release.generatorVersion)
    ).toEqual({ ...multibyteConfiguration, shell: "posix" });
  });

  it("round-trips an explicitly shared configuration through a URL fragment", () => {
    const hash = serializeConfigurationHash(
      configuration,
      release,
      "powershell"
    );

    expect(
      parseConfigurationHash(hash, recipeVersions, release.generatorVersion)
    ).toEqual({ ...configuration, shell: "powershell" });
  });

  it.each([
    "#v=2&generatorVersion=0.3.0&recipe=react-vite-spa&recipeVersion=2&shell=posix&destination=x&description=x&githubOwner=x&initializeGit=1&installDependencies=1",
    "#v=1&generatorVersion=0.3.0&recipe=unknown&recipeVersion=2&shell=posix&destination=x&description=x&githubOwner=x&initializeGit=1&installDependencies=1",
    "#v=1&generatorVersion=0.3.0&recipe=react-vite-spa&recipe=astro-static-site&recipeVersion=2&shell=posix&destination=x&description=x&githubOwner=x&initializeGit=1&installDependencies=1",
    "#v=1&generatorVersion=0.3.0&recipe=react-vite-spa&recipeVersion=2&shell=posix&destination=x&description=x&githubOwner=x&initializeGit=maybe&installDependencies=1",
    "#v=1&generatorVersion=0.3.0&recipe=react-vite-spa&recipeVersion=2&shell=posix&destination=x&description=x&githubOwner=x&initializeGit=1&installDependencies=1&extra=x",
    "#v=1&generatorVersion=9.9.9&recipe=react-vite-spa&recipeVersion=2&shell=posix&destination=x&description=x&githubOwner=x&initializeGit=1&installDependencies=1",
    "#v=1&generatorVersion=0.3.0&recipe=react-vite-spa&recipeVersion=3&shell=posix&destination=x&description=x&githubOwner=x&initializeGit=1&installDependencies=1",
    "#v=1&generatorVersion=0.3.0&recipe=react-vite-spa&recipeVersion=2&shell=posix&destination=..&description=x&githubOwner=x&initializeGit=1&installDependencies=1",
    "#v=1&generatorVersion=0.3.0&recipe=react-vite-spa&recipeVersion=2&shell=cmd&destination=x&description=x&githubOwner=x&initializeGit=1&installDependencies=1",
  ])("rejects an invalid shared configuration: %s", (hash) => {
    expect(() =>
      parseConfigurationHash(hash, recipeVersions, release.generatorVersion)
    ).toThrow();
  });
});
