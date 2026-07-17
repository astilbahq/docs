import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { jsonResponse } from "../../../discovery";

export const prerender = true;

const skillPath = resolve(
  process.cwd(),
  "../public/.well-known/agent-skills/astilba-cache-docs/SKILL.md"
);
const skill = await readFile(skillPath);
const digest = `sha256:${createHash("sha256").update(skill).digest("hex")}`;

export const GET = (): Response =>
  jsonResponse({
    $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
    skills: [
      {
        description:
          "Consult Astilba's public Cache documentation to explain or evaluate the unreleased TypeScript cache preview without inventing installation or production support.",
        digest,
        name: "astilba-cache-docs",
        type: "skill-md",
        url: "/docs/.well-known/agent-skills/astilba-cache-docs/SKILL.md",
      },
    ],
  });
