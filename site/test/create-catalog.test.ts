import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  loadCreateCatalog,
  validateCreateCatalog,
} from "../src/create-catalog";

const require = createRequire(import.meta.url);
const packageRoot = path.dirname(
  require.resolve("create-astilba/package.json")
);

const readSchema = async (): Promise<object> =>
  JSON.parse(
    await readFile(path.join(packageRoot, "schemas", "catalog-v1.json"), "utf8")
  ) as object;

describe("Create catalog", () => {
  it("loads the exact released catalog from the installed CLI", async () => {
    const catalog = await loadCreateCatalog();

    expect(catalog.generator).toEqual({
      name: "create-astilba",
      version: "0.3.0",
    });
    expect(catalog.recipes).toEqual([
      {
        description: "An ESM package with declarations and packaging checks.",
        id: "typescript-library",
        label: "TypeScript library",
        version: 2,
      },
      {
        description: "A client-rendered React application built with Vite.",
        id: "react-vite-spa",
        label: "React + Vite application",
        version: 2,
      },
      {
        description: "A statically rendered Astro site.",
        id: "astro-static-site",
        label: "Astro static site",
        version: 2,
      },
      {
        description: "A TypeScript service running on Cloudflare Workers.",
        id: "cloudflare-worker-service",
        label: "Cloudflare Worker service",
        version: 2,
      },
    ]);
  });

  it("fails closed when the catalog version differs from the package", async () => {
    const catalog = await loadCreateCatalog();
    const schema = await readSchema();

    expect(() =>
      validateCreateCatalog(catalog, schema, {
        name: "create-astilba",
        version: "9.9.9",
      })
    ).toThrow(
      "The Create catalog generator version must match the installed create-astilba package."
    );
  });

  it("fails closed on duplicate recipe IDs", async () => {
    const catalog = await loadCreateCatalog();
    const schema = await readSchema();
    const firstRecipe = catalog.recipes[0];

    if (firstRecipe === undefined) {
      throw new Error("The released Create catalog must include a recipe.");
    }

    const duplicateCatalog = {
      ...catalog,
      recipes: [...catalog.recipes, firstRecipe],
    };

    expect(() =>
      validateCreateCatalog(duplicateCatalog, schema, {
        name: "create-astilba",
        version: "0.3.0",
      })
    ).toThrow("The Create catalog must not contain duplicate recipe IDs.");
  });
});
