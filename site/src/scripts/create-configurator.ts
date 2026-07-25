import {
  createPosixCommand,
  createPowerShellCommand,
  getDescriptionValidationMessage,
  getDestinationValidationMessage,
  getGithubOwnerValidationMessage,
  parseConfigurationHash,
  serializeConfigurationHash,
} from "../create-command";
import type {
  CreateCommandShell,
  CreateConfiguration,
} from "../create-command";

const requireElement = <ElementType extends Element>(
  root: Document | Element,
  selector: string,
  constructor: abstract new (...arguments_: never[]) => ElementType
): ElementType => {
  const element = root.querySelector(selector);

  if (!(element instanceof constructor)) {
    throw new Error(`Create configurator is missing ${selector}.`);
  }

  return element;
};

const writeClipboard = async (value: string): Promise<void> => {
  if (!navigator.clipboard) {
    throw new Error("Clipboard access is unavailable.");
  }

  await navigator.clipboard.writeText(value);
};

const inferName = (destination: string): string => {
  const segment = destination.split("/").at(-1) ?? "";

  return segment
    .toLowerCase()
    .replaceAll(/[^a-z\d]+/gu, "-")
    .replaceAll(/^-+|-+$/gu, "")
    .slice(0, 63)
    .replace(/-+$/u, "");
};

const initializeConfigurator = (root: HTMLElement): void => {
  const form = requireElement(root, "form", HTMLFormElement);
  const command = requireElement(root, "[data-create-command]", HTMLElement);
  const commandPanel = requireElement(
    root,
    "[data-command-panel]",
    HTMLElement
  );
  const copyCommand = requireElement(
    root,
    "[data-copy-command]",
    HTMLButtonElement
  );
  const copyConfiguration = requireElement(
    root,
    "[data-copy-configuration]",
    HTMLButtonElement
  );
  const destination = requireElement(
    form,
    "[name=destination]",
    HTMLInputElement
  );
  const description = requireElement(
    form,
    "[name=description]",
    HTMLTextAreaElement
  );
  const githubOwner = requireElement(
    form,
    "[name=githubOwner]",
    HTMLInputElement
  );
  const destinationError = requireElement(
    form,
    "[data-destination-error]",
    HTMLElement
  );
  const descriptionError = requireElement(
    form,
    "[data-description-error]",
    HTMLElement
  );
  const githubOwnerError = requireElement(
    form,
    "[data-github-owner-error]",
    HTMLElement
  );
  const initializeGit = requireElement(
    form,
    "[name=initializeGit]",
    HTMLInputElement
  );
  const installDependencies = requireElement(
    form,
    "[name=installDependencies]",
    HTMLInputElement
  );
  const inferredName = requireElement(
    form,
    "[data-inferred-name]",
    HTMLElement
  );
  const status = requireElement(
    root,
    "[data-configurator-status]",
    HTMLElement
  );
  const shareFallback = requireElement(
    root,
    "[data-share-fallback]",
    HTMLElement
  );
  const shareFallbackInput = requireElement(
    root,
    "[data-share-fallback-input]",
    HTMLInputElement
  );
  const generatorVersion = root.dataset.generatorVersion;

  if (generatorVersion === undefined) {
    throw new Error("Create configurator is missing its generator version.");
  }

  const recipeInputs = [
    ...form.querySelectorAll<HTMLInputElement>("[name=recipe]"),
  ];
  const shellInputs = [
    ...root.querySelectorAll<HTMLInputElement>("[name=shell]"),
  ];
  const recipeVersions = new Map(
    recipeInputs.map((input) => {
      const version = Number(input.dataset.recipeVersion);

      if (!Number.isSafeInteger(version) || version < 1) {
        throw new Error(
          `Create configurator recipe ${input.value} has an invalid version.`
        );
      }

      return [input.value, version] as const;
    })
  );
  const resetTimers = new Map<HTMLButtonElement, number>();
  let interactedFields = new WeakSet<HTMLInputElement | HTMLTextAreaElement>();
  let statusOwner: HTMLButtonElement | undefined;

  const isProjectField = (
    target: EventTarget | null
  ): target is HTMLInputElement | HTMLTextAreaElement =>
    target === destination || target === description || target === githubOwner;

  const setCopyState = (
    button: HTMLButtonElement,
    state: "copied" | "error" | "idle",
    message = ""
  ): void => {
    button.dataset.copyState = state;
    status.textContent = message;
    statusOwner = state === "idle" ? undefined : button;

    const existingTimer = resetTimers.get(button);
    if (existingTimer !== undefined) {
      window.clearTimeout(existingTimer);
      resetTimers.delete(button);
    }

    if (state !== "idle") {
      const timer = window.setTimeout(() => {
        button.dataset.copyState = "idle";
        if (statusOwner === button) {
          status.textContent = "";
          statusOwner = undefined;
        }
        resetTimers.delete(button);
      }, 2000);
      resetTimers.set(button, timer);
    }
  };

  const resetShareFallback = (): void => {
    shareFallback.hidden = true;
    shareFallbackInput.value = "";
  };

  const updateCustomValidity = (): {
    readonly descriptionMessage?: string;
    readonly destinationMessage?: string;
    readonly githubOwnerMessage?: string;
  } => {
    const descriptionMessage = getDescriptionValidationMessage(
      description.value
    );
    const destinationMessage = getDestinationValidationMessage(
      destination.value
    );
    const githubOwnerMessage = getGithubOwnerValidationMessage(
      githubOwner.value
    );

    const updateField = (
      field: HTMLInputElement | HTMLTextAreaElement,
      error: HTMLElement,
      message: string | undefined
    ): void => {
      field.setCustomValidity(message ?? "");
      const shouldPresent =
        message !== undefined && interactedFields.has(field);

      if (shouldPresent) {
        field.setAttribute("aria-invalid", "true");
        error.textContent = message;
        error.hidden = false;
      } else {
        field.removeAttribute("aria-invalid");
        error.textContent = "";
        error.hidden = true;
      }
    };

    updateField(description, descriptionError, descriptionMessage);
    updateField(destination, destinationError, destinationMessage);
    updateField(githubOwner, githubOwnerError, githubOwnerMessage);

    return {
      ...(descriptionMessage === undefined ? {} : { descriptionMessage }),
      ...(destinationMessage === undefined ? {} : { destinationMessage }),
      ...(githubOwnerMessage === undefined ? {} : { githubOwnerMessage }),
    };
  };

  const readConfiguration = (): CreateConfiguration | undefined => {
    updateCustomValidity();
    const recipe = recipeInputs.find((input) => input.checked)?.value;

    if (recipe === undefined || !form.checkValidity()) {
      return undefined;
    }

    return {
      description: description.value,
      destination: destination.value,
      githubOwner: githubOwner.value,
      initializeGit: initializeGit.checked,
      installDependencies: installDependencies.checked,
      recipe,
    };
  };

  const readShell = (): CreateCommandShell => {
    const shell = shellInputs.find((input) => input.checked)?.value;

    if (shell === "posix" || shell === "powershell") {
      return shell;
    }

    throw new Error("Create configurator is missing a supported shell.");
  };

  const render = (): void => {
    const validation = updateCustomValidity();
    const configuration = readConfiguration();
    const inferred = inferName(destination.value);
    const shell = readShell();

    inferredName.textContent =
      inferred.length > 0 ? inferred : "Waiting for a portable directory";

    copyCommand.disabled = configuration === undefined;
    copyConfiguration.disabled = configuration === undefined;
    commandPanel.dataset.ready = configuration === undefined ? "false" : "true";
    command.textContent =
      configuration === undefined
        ? (destination.value.length > 0 && validation.destinationMessage) ||
          (description.value.length > 0 && validation.descriptionMessage) ||
          (githubOwner.value.length > 0 && validation.githubOwnerMessage) ||
          "Choose a recipe and complete the required fields."
        : shell === "powershell"
          ? createPowerShellCommand(configuration, generatorVersion)
          : createPosixCommand(configuration, generatorVersion);
  };

  const copyWithState = async (
    button: HTMLButtonElement,
    value: string,
    successMessage: string,
    failureMessage: string,
    onFailure?: () => void
  ): Promise<void> => {
    try {
      await writeClipboard(value);
      resetShareFallback();
      setCopyState(button, "copied", successMessage);
    } catch {
      onFailure?.();
      setCopyState(button, "error", failureMessage);
    }
  };

  const selectCommand = (): void => {
    command.focus();

    const selection = window.getSelection();
    if (selection === null) {
      return;
    }

    const range = document.createRange();
    range.selectNodeContents(command);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  copyCommand.addEventListener("click", () => {
    const configuration = readConfiguration();

    if (configuration === undefined) {
      form.reportValidity();
      status.textContent = "Complete the required fields first.";
      return;
    }

    resetShareFallback();
    void copyWithState(
      copyCommand,
      command.textContent ?? "",
      "Command copied.",
      "Clipboard access failed. The command is selected above.",
      selectCommand
    );
  });

  copyConfiguration.addEventListener("click", () => {
    const configuration = readConfiguration();

    if (configuration === undefined) {
      form.reportValidity();
      status.textContent = "Complete the required fields first.";
      return;
    }

    const url = new URL(window.location.pathname, window.location.origin);
    const recipeVersion = recipeVersions.get(configuration.recipe);

    if (recipeVersion === undefined) {
      throw new Error(
        `Create configurator recipe ${configuration.recipe} is missing its version.`
      );
    }

    url.hash = serializeConfigurationHash(
      configuration,
      {
        generatorVersion,
        recipeVersion,
      },
      readShell()
    );
    void copyWithState(
      copyConfiguration,
      url.href,
      "Configuration link copied.",
      "Clipboard access failed. The configuration link is selected above.",
      () => {
        shareFallbackInput.value = url.href;
        shareFallback.hidden = false;
        shareFallbackInput.focus();
        shareFallbackInput.select();
      }
    );
  });

  const resetCopyStates = (): void => {
    for (const button of [copyCommand, copyConfiguration]) {
      const timer = resetTimers.get(button);
      if (timer !== undefined) {
        window.clearTimeout(timer);
        resetTimers.delete(button);
      }
      button.dataset.copyState = "idle";
    }
    status.textContent = "";
    statusOwner = undefined;
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
  });

  form.addEventListener("input", (event) => {
    if (isProjectField(event.target)) {
      interactedFields.add(event.target);
    }
    resetShareFallback();
    resetCopyStates();
    render();
  });

  form.addEventListener("focusout", (event) => {
    if (isProjectField(event.target)) {
      interactedFields.add(event.target);
      render();
    }
  });

  for (const shellInput of shellInputs) {
    shellInput.addEventListener("input", () => {
      resetShareFallback();
      resetCopyStates();
      render();
    });
  }

  let lastObservedHash = window.location.hash;

  const hydrateSharedConfiguration = (): void => {
    const currentHash = window.location.hash;
    const previousHash = lastObservedHash;
    lastObservedHash = currentHash;

    if (
      (currentHash.length > 0 && !currentHash.startsWith("#v=")) ||
      (currentHash.length === 0 &&
        previousHash.length > 0 &&
        !previousHash.startsWith("#v="))
    ) {
      return;
    }

    resetCopyStates();
    resetShareFallback();

    const resetForm = (): void => {
      form.reset();
      for (const shellInput of shellInputs) {
        shellInput.checked = shellInput.defaultChecked;
      }
      interactedFields = new WeakSet<HTMLInputElement | HTMLTextAreaElement>();
    };

    try {
      const shared = parseConfigurationHash(
        window.location.hash,
        recipeVersions,
        generatorVersion
      );

      if (shared === undefined) {
        resetForm();
        render();
        return;
      }
      const recipe = recipeInputs.find(
        (input) => input.value === shared.recipe
      );

      if (recipe === undefined) {
        throw new Error("The shared configuration uses an unknown recipe.");
      }
      const shell = shellInputs.find((input) => input.value === shared.shell);

      if (shell === undefined) {
        throw new Error("The shared configuration uses an unknown shell.");
      }

      interactedFields.add(destination);
      interactedFields.add(description);
      interactedFields.add(githubOwner);
      recipe.checked = true;
      shell.checked = true;
      destination.value = shared.destination;
      description.value = shared.description;
      githubOwner.value = shared.githubOwner;
      initializeGit.checked = shared.initializeGit;
      installDependencies.checked = shared.installDependencies;

      updateCustomValidity();
      if (!form.checkValidity()) {
        throw new Error("The shared configuration contains invalid values.");
      }

      render();
      status.textContent = "Shared configuration loaded.";
    } catch (error: unknown) {
      resetForm();
      render();
      status.textContent =
        error instanceof Error
          ? error.message
          : "The shared configuration could not be loaded.";
    }
  };

  render();
  hydrateSharedConfiguration();
  window.addEventListener("hashchange", hydrateSharedConfiguration);
};

const root = document.querySelector("[data-create-configurator]");

if (root instanceof HTMLElement) {
  initializeConfigurator(root);
}
