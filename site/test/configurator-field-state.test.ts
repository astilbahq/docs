import { describe, expect, it, vi } from "vitest";

import {
  resolveConfigurationHashNavigation,
  resolveDescribedBy,
  withCurrentConfigurationHashNavigation,
} from "../src/configurator-field-state";

describe("Create configurator field state", () => {
  it("adds and removes the active error without losing help associations", () => {
    expect(
      resolveDescribedBy("destination-help", "destination-error", true)
    ).toBe("destination-help destination-error");
    expect(
      resolveDescribedBy(
        "destination-help destination-error",
        "destination-error",
        false
      )
    ).toBe("destination-help");
  });

  it("does not leave an empty described-by attribute", () => {
    expect(
      resolveDescribedBy(null, "destination-error", false)
    ).toBeUndefined();
  });

  it("uses the hashchange snapshot when it still matches the current URL", () => {
    expect(
      resolveConfigurationHashNavigation("#v=current", "#v=observed", {
        newURL: "https://astilba.com/create/new/#v=current",
        oldURL: "https://astilba.com/create/new/#v=previous",
      })
    ).toEqual({
      currentHash: "#v=current",
      previousHash: "#v=previous",
      stale: false,
    });
  });

  it("marks a queued hashchange stale after the browser has moved again", () => {
    const apply = vi.fn();

    withCurrentConfigurationHashNavigation(
      "#overview",
      "#v=observed",
      {
        newURL: "https://astilba.com/create/new/#v=transient",
        oldURL: "https://astilba.com/create/new/#overview",
      },
      apply
    );

    expect(apply).not.toHaveBeenCalled();
  });

  it("applies current hashchange snapshots once", () => {
    const apply = vi.fn();

    withCurrentConfigurationHashNavigation(
      "#v=current",
      "#v=observed",
      {
        newURL: "https://astilba.com/create/new/#v=current",
        oldURL: "https://astilba.com/create/new/#v=previous",
      },
      apply
    );

    expect(apply).toHaveBeenCalledOnce();
    expect(apply).toHaveBeenCalledWith({
      currentHash: "#v=current",
      previousHash: "#v=previous",
      stale: false,
    });
  });
});
