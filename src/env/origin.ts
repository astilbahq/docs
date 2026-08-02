import { ASTILBA_ORIGIN } from "../docs/urls.ts";

type TargetCheck = Readonly<{ ok: boolean }>;

export const resolveCanonicalOrigin = (
  sourceName: string,
  result: TargetCheck,
  origin: string | undefined
): string | undefined => {
  if (!result.ok) {
    throw new Error(
      `${sourceName} must be a valid public HTTPS origin. Set ${sourceName} to ${ASTILBA_ORIGIN}.`
    );
  }

  if (origin !== undefined && origin !== ASTILBA_ORIGIN) {
    throw new Error(
      `${sourceName} must use the canonical deployed origin ${ASTILBA_ORIGIN}.`
    );
  }

  return origin;
};
