import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { promisify } from "node:util";

import { Ajv2020 } from "ajv/dist/2020.js";

const executeFile = promisify(execFile);
const require = createRequire(import.meta.url);
const packageRoot = path.dirname(
  require.resolve("create-astilba/package.json")
);
const catalogSchemaPath = path.join(packageRoot, "schemas", "catalog-v1.json");
const cliPath = path.join(packageRoot, "dist", "bin.js");
const packageJsonPath = path.join(packageRoot, "package.json");
const catalogEnvironment = { ...process.env };
delete catalogEnvironment.FORCE_COLOR;
delete catalogEnvironment.NO_COLOR;

interface CreateCatalogRecipe {
  readonly description: string;
  readonly id: string;
  readonly label: string;
  readonly version: number;
}

export interface CreateCatalog {
  readonly command: "catalog";
  readonly generator: {
    readonly name: "create-astilba";
    readonly version: string;
  };
  readonly ok: true;
  readonly recipes: readonly CreateCatalogRecipe[];
  readonly schemaVersion: 1;
}

interface InstalledPackage {
  readonly name?: string;
  readonly version?: string;
}

const parseJson = (source: string, label: string): unknown => {
  try {
    return JSON.parse(source);
  } catch (error: unknown) {
    throw new Error(`${label} is not valid JSON.`, { cause: error });
  }
};

const assertSingleLineJson = (source: string): void => {
  if (!source.endsWith("\n") || source.slice(0, -1).includes("\n")) {
    throw new Error(
      "create-astilba --catalog --json must emit exactly one newline-terminated JSON object."
    );
  }
};

export const validateCreateCatalog = (
  value: unknown,
  schema: object,
  installedPackage: InstalledPackage
): CreateCatalog => {
  const validate = new Ajv2020({ allErrors: true, strict: true }).compile(
    schema
  );

  if (!validate(value)) {
    throw new Error(
      `The installed Create catalog does not match catalog schema v1: ${JSON.stringify(
        validate.errors
      )}`
    );
  }

  const catalog = value as CreateCatalog;

  if (
    installedPackage.name !== "create-astilba" ||
    installedPackage.version === undefined ||
    catalog.generator.version !== installedPackage.version
  ) {
    throw new Error(
      "The Create catalog generator version must match the installed create-astilba package."
    );
  }

  const recipeIds = new Set(catalog.recipes.map((recipe) => recipe.id));
  if (recipeIds.size !== catalog.recipes.length) {
    throw new Error(
      "The Create catalog must not contain duplicate recipe IDs."
    );
  }

  return catalog;
};

export const loadCreateCatalog = async (): Promise<CreateCatalog> => {
  const [{ stderr, stdout }, packageJsonSource, schemaSource] =
    await Promise.all([
      executeFile(process.execPath, [cliPath, "--catalog", "--json"], {
        encoding: "utf8",
        env: catalogEnvironment,
        maxBuffer: 64 * 1024,
        timeout: 5000,
      }),
      readFile(packageJsonPath, "utf8"),
      readFile(catalogSchemaPath, "utf8"),
    ]);

  if (stderr.length > 0) {
    throw new Error(
      `create-astilba --catalog --json wrote to stderr: ${stderr}`
    );
  }

  assertSingleLineJson(stdout);

  return validateCreateCatalog(
    parseJson(stdout, "Create catalog"),
    parseJson(schemaSource, "Create catalog schema") as object,
    parseJson(
      packageJsonSource,
      "create-astilba package metadata"
    ) as InstalledPackage
  );
};
