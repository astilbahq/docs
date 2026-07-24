import { jsonResponse } from "../../../discovery";
import { createProjectManifestSchemaV1 } from "../../../schemas/create-project-v1";

export const prerender = true;

export const GET = (): Response =>
  jsonResponse(
    createProjectManifestSchemaV1,
    "application/schema+json; charset=utf-8"
  );
