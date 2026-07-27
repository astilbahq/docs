export const resolveDescribedBy = (
  currentValue: string | null,
  errorId: string,
  includeError: boolean
): string | undefined => {
  const describedBy = new Set(
    (currentValue ?? "").split(/\s+/u).filter(Boolean)
  );
  describedBy.delete(errorId);

  if (includeError) {
    describedBy.add(errorId);
  }

  return describedBy.size === 0 ? undefined : [...describedBy].join(" ");
};

interface HashChangeSnapshot {
  readonly newURL: string;
  readonly oldURL: string;
}

export interface ConfigurationHashNavigation {
  readonly currentHash: string;
  readonly previousHash: string;
  readonly stale: boolean;
}

export const resolveConfigurationHashNavigation = (
  locationHash: string,
  lastObservedHash: string,
  event?: HashChangeSnapshot
): ConfigurationHashNavigation => {
  const currentHash =
    event === undefined ? locationHash : new URL(event.newURL).hash;
  const previousHash =
    event === undefined ? lastObservedHash : new URL(event.oldURL).hash;

  return {
    currentHash,
    previousHash,
    stale: event !== undefined && currentHash !== locationHash,
  };
};

export const withCurrentConfigurationHashNavigation = (
  locationHash: string,
  lastObservedHash: string,
  event: HashChangeSnapshot | undefined,
  apply: (navigation: ConfigurationHashNavigation) => void
): void => {
  const navigation = resolveConfigurationHashNavigation(
    locationHash,
    lastObservedHash,
    event
  );

  if (!navigation.stale) {
    apply(navigation);
  }
};
