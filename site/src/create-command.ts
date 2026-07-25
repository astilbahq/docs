export interface CreateConfiguration {
  readonly description: string;
  readonly destination: string;
  readonly githubOwner: string;
  readonly initializeGit: boolean;
  readonly installDependencies: boolean;
  readonly recipe: string;
}

export interface CreateConfigurationRelease {
  readonly generatorVersion: string;
  readonly recipeVersion: number;
}

const SAFE_POSIX_TOKEN = /^[A-Za-z0-9_@%+=:,./-]+$/u;
const CONTROL_OR_FORMATTING_CHARACTER_PATTERN = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/u;
const WINDOWS_DEVICE_NAME_PATTERN =
  /^(?:aux|con|nul|prn|com[1-9]|lpt[1-9])(?:\.|$)/iu;
const WINDOWS_FORBIDDEN_CHARACTERS = '<>:"|?*';
const WINDOWS_ROOT_PATTERN = /^(?:[A-Za-z]:|[/\\])/u;
const GITHUB_OWNER_PATTERN = /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/iu;

export const quotePosixShellToken = (value: string): string => {
  if (value.length > 0 && SAFE_POSIX_TOKEN.test(value)) {
    return value;
  }

  return `'${value.replaceAll("'", "'\"'\"'")}'`;
};

export const quotePowerShellToken = (value: string): string => {
  return `'${value.replaceAll("'", "''")}'`;
};

export const createCommandTokens = (
  configuration: CreateConfiguration,
  generatorVersion: string
): readonly string[] => [
  "npm",
  "create",
  `astilba@${generatorVersion}`,
  "--",
  `--recipe=${configuration.recipe}`,
  `--description=${configuration.description}`,
  `--github-owner=${configuration.githubOwner}`,
  configuration.initializeGit ? "--git" : "--no-git",
  configuration.installDependencies ? "--install" : "--no-install",
  "--",
  configuration.destination,
];

export const createPosixCommand = (
  configuration: CreateConfiguration,
  generatorVersion: string
): string =>
  createCommandTokens(configuration, generatorVersion)
    .map(quotePosixShellToken)
    .join(" ");

export const createPowerShellCommand = (
  configuration: CreateConfiguration,
  generatorVersion: string
): string =>
  [
    "npm",
    "create",
    `astilba@${generatorVersion}`,
    "--",
    quotePowerShellToken(`--recipe=${configuration.recipe}`),
    quotePowerShellToken(`--description=${configuration.description}`),
    quotePowerShellToken(`--github-owner=${configuration.githubOwner}`),
    configuration.initializeGit ? "--git" : "--no-git",
    configuration.installDependencies ? "--install" : "--no-install",
    "--",
    quotePowerShellToken(configuration.destination),
  ].join(" ");

const isPortableDestinationSegment = (segment: string): boolean => {
  if (
    segment.length === 0 ||
    segment === "." ||
    segment === ".." ||
    segment.toLowerCase() === ".git" ||
    segment.endsWith(".") ||
    segment.endsWith(" ") ||
    WINDOWS_DEVICE_NAME_PATTERN.test(segment)
  ) {
    return false;
  }

  for (const character of segment) {
    const codePoint = character.codePointAt(0);

    if (
      codePoint === undefined ||
      codePoint < 32 ||
      codePoint > 126 ||
      WINDOWS_FORBIDDEN_CHARACTERS.includes(character)
    ) {
      return false;
    }
  }

  return true;
};

export const getDestinationValidationMessage = (
  destination: string
): string | undefined => {
  if (
    destination.length === 0 ||
    destination.length > 180 ||
    CONTROL_OR_FORMATTING_CHARACTER_PATTERN.test(destination)
  ) {
    return "Destination must contain between 1 and 180 characters without control or formatting characters.";
  }

  if (
    WINDOWS_ROOT_PATTERN.test(destination) ||
    destination.includes("\\") ||
    destination
      .split("/")
      .some((segment) => !isPortableDestinationSegment(segment))
  ) {
    return "Destination must be a normalized portable relative path without traversal.";
  }

  const inferredName = destination
    .split("/")
    .at(-1)
    ?.toLowerCase()
    .replaceAll(/[^a-z\d]+/gu, "-")
    .replaceAll(/^-+|-+$/gu, "")
    .slice(0, 63)
    .replace(/-+$/u, "");

  if (!inferredName) {
    return "The destination name must include at least one letter or digit so project metadata can be inferred.";
  }

  return undefined;
};

export const getDescriptionValidationMessage = (
  description: string
): string | undefined => {
  if (description !== description.trim()) {
    return "Description must not start or end with whitespace.";
  }

  if (description.length === 0 || description.length > 280) {
    return "Description must contain between 1 and 280 characters.";
  }

  if (CONTROL_OR_FORMATTING_CHARACTER_PATTERN.test(description)) {
    return "Description must not contain control or formatting characters.";
  }

  return undefined;
};

export const getGithubOwnerValidationMessage = (
  githubOwner: string
): string | undefined => {
  if (
    githubOwner !== githubOwner.trim() ||
    githubOwner.length === 0 ||
    githubOwner.length > 39 ||
    CONTROL_OR_FORMATTING_CHARACTER_PATTERN.test(githubOwner) ||
    !GITHUB_OWNER_PATTERN.test(githubOwner)
  ) {
    return "GitHub owner is not a supported account name.";
  }

  return undefined;
};

const CONFIGURATION_HASH_VERSION = "1";
const CONFIGURATION_KEYS = new Set([
  "description",
  "destination",
  "generatorVersion",
  "githubOwner",
  "initializeGit",
  "installDependencies",
  "recipe",
  "recipeVersion",
  "v",
]);

const readSingleHashValue = (
  parameters: URLSearchParams,
  name: string
): string => {
  const values = parameters.getAll(name);

  if (values.length !== 1) {
    throw new Error(`The shared configuration must include one ${name}.`);
  }

  return values[0] ?? "";
};

const readHashBoolean = (
  parameters: URLSearchParams,
  name: string
): boolean => {
  const value = readSingleHashValue(parameters, name);

  if (value === "1") {
    return true;
  }

  if (value === "0") {
    return false;
  }

  throw new Error(`The shared configuration has an invalid ${name} value.`);
};

export const serializeConfigurationHash = (
  configuration: CreateConfiguration,
  release: CreateConfigurationRelease
): string => {
  const parameters = new URLSearchParams([
    ["v", CONFIGURATION_HASH_VERSION],
    ["generatorVersion", release.generatorVersion],
    ["recipe", configuration.recipe],
    ["recipeVersion", String(release.recipeVersion)],
    ["destination", configuration.destination],
    ["description", configuration.description],
    ["githubOwner", configuration.githubOwner],
    ["initializeGit", configuration.initializeGit ? "1" : "0"],
    ["installDependencies", configuration.installDependencies ? "1" : "0"],
  ]);

  return `#${parameters.toString()}`;
};

export const parseConfigurationHash = (
  hash: string,
  recipeVersions: ReadonlyMap<string, number>,
  generatorVersion: string
): CreateConfiguration | undefined => {
  if (hash.length === 0 || hash === "#") {
    return undefined;
  }

  if (hash.length > 8192) {
    throw new Error("The shared configuration is too long.");
  }

  const parameters = new URLSearchParams(hash.slice(1));

  for (const key of parameters.keys()) {
    if (!CONFIGURATION_KEYS.has(key)) {
      throw new Error(`The shared configuration contains an unknown ${key}.`);
    }
  }

  if (readSingleHashValue(parameters, "v") !== CONFIGURATION_HASH_VERSION) {
    throw new Error("The shared configuration uses an unsupported version.");
  }

  if (
    readSingleHashValue(parameters, "generatorVersion") !== generatorVersion
  ) {
    throw new Error(
      "The shared configuration targets a different Create release."
    );
  }

  const recipe = readSingleHashValue(parameters, "recipe");
  const currentRecipeVersion = recipeVersions.get(recipe);
  if (currentRecipeVersion === undefined) {
    throw new Error("The shared configuration uses an unknown recipe.");
  }

  if (
    readSingleHashValue(parameters, "recipeVersion") !==
    String(currentRecipeVersion)
  ) {
    throw new Error(
      "The shared configuration targets a different recipe release."
    );
  }

  const configuration = {
    description: readSingleHashValue(parameters, "description"),
    destination: readSingleHashValue(parameters, "destination"),
    githubOwner: readSingleHashValue(parameters, "githubOwner"),
    initializeGit: readHashBoolean(parameters, "initializeGit"),
    installDependencies: readHashBoolean(parameters, "installDependencies"),
    recipe,
  };

  const validationMessage =
    getDestinationValidationMessage(configuration.destination) ??
    getDescriptionValidationMessage(configuration.description) ??
    getGithubOwnerValidationMessage(configuration.githubOwner);

  if (validationMessage !== undefined) {
    throw new Error(
      `The shared configuration is invalid: ${validationMessage}`
    );
  }

  return configuration;
};
