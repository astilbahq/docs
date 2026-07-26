import { glob, readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

describe("shared UI imports", () => {
  it("uses component entry points instead of the root barrel", async () => {
    const rootImports: string[] = [];

    for await (const path of glob("src/**/*.{astro,ts,tsx}")) {
      const source = await readFile(path, "utf8");
      if (/from\s+["']@astilba\/ui["']/.test(source)) {
        rootImports.push(path);
      }
    }

    expect(rootImports).toEqual([]);
  });
});
