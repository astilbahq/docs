import { Collapsible } from "@base-ui/react/collapsible";
import { Menu } from "@base-ui/react/menu";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import type { DocsBadge as DocsBadgeModel } from "../docs/types";
import type {
  DocsContextRow,
  DocsSidebarContextModel,
  DocsSidebarEntryModel,
  DocsSidebarGroupModel,
} from "../docs/sidebar-model";
import { DocsIcon } from "./DocsIcon";
import "./DocsSidebar.css";

const desktopMediaQuery = "(min-width: 50em)";
const sidebarStorageKey = "astilba-docs-sidebar-state-v1";
const useBrowserLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

interface StoredSidebarState {
  hash: string;
  open: string[];
  scroll: number;
}

interface DocsSidebarProps {
  context: DocsSidebarContextModel;
  entries: DocsSidebarEntryModel[];
  sidebarHash: string;
}

interface SidebarListProps {
  entries: DocsSidebarEntryModel[];
  nested?: boolean;
  onOpenChange: (id: string, open: boolean) => void;
  openGroups: string[];
}

const collectGroupIds = (
  entries: DocsSidebarEntryModel[],
  predicate: (entry: DocsSidebarGroupModel) => boolean
): string[] =>
  entries.flatMap((entry) => {
    if (entry.type === "link") {
      return [];
    }

    const nestedIds = collectGroupIds(entry.entries, predicate);
    return predicate(entry) ? [entry.id, ...nestedIds] : nestedIds;
  });

const parseStoredState = (
  sidebarHash: string
): StoredSidebarState | undefined => {
  try {
    const value = JSON.parse(
      sessionStorage.getItem(sidebarStorageKey) ?? "null"
    ) as StoredSidebarState | null;

    if (
      value?.hash === sidebarHash &&
      Array.isArray(value.open) &&
      typeof value.scroll === "number"
    ) {
      return value;
    }
  } catch {
    // Session storage is an enhancement; navigation remains usable without it.
  }

  return undefined;
};

const DocsBadge = ({ badge }: { badge: DocsBadgeModel }) => (
  <span className={`docs-badge ${badge.variant}`}>{badge.text}</span>
);

const ContextRowContent = ({ row }: { row: DocsContextRow }) => (
  <>
    <DocsIcon className="docs-context-icon" name={row.icon} size="1rem" />
    <span className="docs-context-label">{row.label}</span>
    {row.status && <DocsBadge badge={row.status} />}
    {row.meta && <span className="docs-context-meta">{row.meta}</span>}
  </>
);

const DocsContextMenu = ({ row }: { row: DocsContextRow }) => {
  const options = row.options ?? [];

  return (
    <Menu.Root modal={false}>
      <Menu.Trigger aria-label={row.ariaLabel} className="docs-context-control">
        <ContextRowContent row={row} />
        <DocsIcon
          className="docs-context-chevron"
          name="down-caret"
          size="0.875rem"
        />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          align="start"
          alignOffset={8}
          className="docs-selector-positioner"
          collisionAvoidance={{
            align: "shift",
            fallbackAxisSide: "none",
            side: "shift",
          }}
          collisionPadding={8}
          side="bottom"
          sideOffset={4}
        >
          <Menu.Popup className="docs-selector-menu">
            {options.map((option) => (
              <Menu.LinkItem
                aria-current={option.selected ? "true" : undefined}
                className="docs-selector-option"
                closeOnClick
                href={option.href}
                key={option.id}
                label={option.label}
              >
                <DocsIcon name={option.icon} size="1rem" />
                <span className="docs-selector-label">{option.label}</span>
                {option.status && <DocsBadge badge={option.status} />}
                {(option.meta || option.selected) && (
                  <span className="docs-selector-trailing">
                    {option.meta && (
                      <span className="docs-selector-meta">{option.meta}</span>
                    )}
                    {option.selected && (
                      <DocsIcon name="approve-check" size="0.875rem" />
                    )}
                  </span>
                )}
              </Menu.LinkItem>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
};

const DocsContext = ({ context }: { context: DocsSidebarContextModel }) => (
  <div
    aria-label="Documentation context"
    className="docs-context"
    role="group"
  >
    <DocsContextMenu row={context.product} />
    {context.version &&
      (context.version.options ? (
        <DocsContextMenu row={context.version} />
      ) : (
        <div
          aria-label={context.version.ariaLabel}
          className="docs-context-control is-static"
          role="group"
        >
          <ContextRowContent row={context.version} />
        </div>
      ))}
  </div>
);

const SidebarList = ({
  entries,
  nested,
  onOpenChange,
  openGroups,
}: SidebarListProps) => (
  <ul
    className={`docs-sidebar-tree${nested ? "" : " docs-sidebar-top-level"}`}
  >
    {entries.map((entry) => {
      if (entry.type === "link") {
        return (
          <li key={entry.id}>
            <a
              {...entry.attrs}
              aria-current={entry.isCurrent ? "page" : undefined}
              className={`docs-nav-link${
                entry.className ? ` ${entry.className}` : ""
              }`}
              href={entry.href}
            >
              <span aria-hidden="true" className="docs-nav-icon">
                {entry.icon && <DocsIcon name={entry.icon} size="1rem" />}
              </span>
              <span className="docs-nav-label">{entry.label}</span>
              {entry.badge && <DocsBadge badge={entry.badge} />}
            </a>
          </li>
        );
      }

      return (
        <Collapsible.Root
          className="docs-sidebar-group"
          key={entry.id}
          onOpenChange={(open) => onOpenChange(entry.id, open)}
          open={openGroups.includes(entry.id)}
          render={<li />}
        >
          <Collapsible.Trigger className="docs-group-trigger">
            <span className="docs-group-label">
              <span>{entry.label}</span>
              {entry.badge && <DocsBadge badge={entry.badge} />}
            </span>
            <DocsIcon
              className="docs-group-caret"
              name="right-caret"
              size="1rem"
            />
          </Collapsible.Trigger>
          <Collapsible.Panel className="docs-collapsible-panel">
            <SidebarList
              entries={entry.entries}
              nested
              onOpenChange={onOpenChange}
              openGroups={openGroups}
            />
          </Collapsible.Panel>
        </Collapsible.Root>
      );
    })}
  </ul>
);

export default function DocsSidebar({
  context,
  entries,
  sidebarHash,
}: DocsSidebarProps) {
  const activeGroupIds = useMemo(
    () => collectGroupIds(entries, (entry) => entry.containsCurrent),
    [entries]
  );
  const defaultOpenGroupIds = useMemo(
    () =>
      collectGroupIds(
        entries,
        (entry) => entry.containsCurrent || !entry.collapsed
      ),
    [entries]
  );
  const allGroupIds = useMemo(
    () => new Set(collectGroupIds(entries, () => true)),
    [entries]
  );
  const [openGroups, setOpenGroups] = useState(defaultOpenGroupIds);
  const [restored, setRestored] = useState(false);

  useBrowserLayoutEffect(() => {
    let nextOpenGroups = defaultOpenGroupIds;

    if (window.matchMedia(desktopMediaQuery).matches) {
      const storedState = parseStoredState(sidebarHash);

      if (storedState) {
        nextOpenGroups = Array.from(
          new Set([
            ...storedState.open.filter((id) => allGroupIds.has(id)),
            ...activeGroupIds,
          ])
        );

        const scroller = document.getElementById("starlight__sidebar");
        if (scroller) {
          scroller.scrollTop = storedState.scroll;
        }
      }
    }

    setOpenGroups(nextOpenGroups);
    setRestored(true);
  }, [
    activeGroupIds,
    allGroupIds,
    defaultOpenGroupIds,
    sidebarHash,
  ]);

  const storeState = useCallback(
    (groups: string[]) => {
      if (!window.matchMedia(desktopMediaQuery).matches) {
        return;
      }

      try {
        const scroller = document.getElementById("starlight__sidebar");
        const state: StoredSidebarState = {
          hash: sidebarHash,
          open: groups,
          scroll: scroller?.scrollTop ?? 0,
        };
        sessionStorage.setItem(sidebarStorageKey, JSON.stringify(state));
      } catch {
        // Session storage is an enhancement; navigation remains usable without it.
      }
    },
    [sidebarHash]
  );

  useEffect(() => {
    if (!restored) {
      return;
    }

    storeState(openGroups);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        storeState(openGroups);
      }
    };
    const handlePageHide = () => storeState(openGroups);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [openGroups, restored, storeState]);

  const handleOpenChange = useCallback((id: string, open: boolean) => {
    setOpenGroups((current) => {
      if (open) {
        return current.includes(id) ? current : [...current, id];
      }

      return current.filter((groupId) => groupId !== id);
    });
  }, []);

  return (
    <div
      className="docs-sidebar-root"
      data-restoring={restored ? undefined : ""}
    >
      <DocsContext context={context} />
      {entries.length > 0 && (
        <SidebarList
          entries={entries}
          onOpenChange={handleOpenChange}
          openGroups={openGroups}
        />
      )}
    </div>
  );
}
