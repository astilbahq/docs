import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";

import { createProjectManifestSchemaV1 } from "../../site/src/schemas/create-project-v1";

const digest = "a".repeat(64);
const recipeIds = [
  "typescript-library",
  "react-vite-spa",
  "astro-static-site",
  "cloudflare-worker-service",
] as const;

const createManifest = (recipeId: (typeof recipeIds)[number]) => ({
  $schema: "https://astilba.com/schemas/create/v1.json",
  features: [],
  generator: {
    name: "create-astilba",
    version: "0.2.0",
  },
  ownership: {
    managed: [{ path: ".editorconfig", sha256: digest }],
    metadata: ".astilba/project.json",
    seeded: ["README.md", "src/index.ts"],
    structured: [
      {
        fields: [{ pointer: "/scripts/build", sha256: digest }],
        path: "package.json",
      },
    ],
    symlinks: [{ path: "CLAUDE.md", target: "AGENTS.md" }],
  },
  recipe: {
    id: recipeId,
    version: 2,
  },
  schemaVersion: 1,
});

describe("Create project manifest schema", () => {
  const validate = new Ajv2020({ strict: true }).compile(
    createProjectManifestSchemaV1
  );

  it.each(recipeIds)("accepts the %s recipe v2 manifest shape", (recipeId) => {
    expect(validate(createManifest(recipeId))).toBe(true);
  });

  it("rejects an unrecognized ownership field", () => {
    const manifest = createManifest("typescript-library");

    expect(
      validate({
        ...manifest,
        ownership: {
          ...manifest.ownership,
          untracked: ["secrets.env"],
        },
      })
    ).toBe(false);
  });

  it("rejects malformed digests and future schema versions", () => {
    const manifest = createManifest("typescript-library");

    expect(
      validate({
        ...manifest,
        ownership: {
          ...manifest.ownership,
          managed: [{ path: ".editorconfig", sha256: "not-a-digest" }],
        },
      })
    ).toBe(false);
    expect(validate({ ...manifest, schemaVersion: 2 })).toBe(false);
  });

  it.each([
    "",
    ".",
    "../escape",
    "src/../escape",
    "/absolute",
    "C:/absolute",
    "C:\\absolute",
    "\\\\server\\share",
    "double//separator",
    "trailing/",
    "line\nbreak",
    ".git/config",
    "nested/.GIT/config",
    ".astilba-create-incomplete",
    ".Astilba-Create-Incomplete/file.txt",
    "CON",
    "con.txt",
    "file?.ts",
    "file:stream",
    "trailing.",
    "trailing ",
    "unicode-λ.ts",
  ])("rejects the unsafe project path %j", (projectPath) => {
    const manifest = createManifest("typescript-library");

    expect(
      validate({
        ...manifest,
        ownership: {
          ...manifest.ownership,
          seeded: [projectPath],
        },
      })
    ).toBe(false);
  });

  it("requires structured fields to use valid non-root JSON Pointers", () => {
    const manifest = createManifest("typescript-library");

    expect(
      validate({
        ...manifest,
        ownership: {
          ...manifest.ownership,
          structured: [
            {
              fields: [{ pointer: "/bad~2escape", sha256: digest }],
              path: "package.json",
            },
          ],
        },
      })
    ).toBe(false);
    expect(
      validate({
        ...manifest,
        ownership: {
          ...manifest.ownership,
          structured: [
            {
              fields: [{ pointer: "/valid~0escape/~1", sha256: digest }],
              path: "package.json",
            },
          ],
        },
      })
    ).toBe(true);
  });
});
