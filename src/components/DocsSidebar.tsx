import { Collapsible } from "@base-ui/react/collapsible";
import { Menu } from "@base-ui/react/menu";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

import { cx } from "../../styled-system/css";
import type {
  DocsContextRow,
  DocsSidebarContextModel,
  DocsSidebarEntryModel,
} from "../docs/sidebar-model";
import { collectDocsSidebarGroupIds } from "../docs/sidebar-model";
import type { DocsBadge as DocsBadgeModel } from "../docs/types";
import { DocsIcon } from "./DocsIcon";
import { docsSidebarStyles as styles } from "./DocsSidebar.styles";

const desktopMediaQuery = "(min-width: 50em)";
const sidebarBootstrapStyleId = "astilba-docs-sidebar-bootstrap-style";
const sidebarScrollSelector = "#starlight__sidebar [data-docs-sidebar-scroll]";
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

const getSidebarScroller = (): HTMLElement | null =>
  document.querySelector<HTMLElement>(sidebarScrollSelector);

const DocsBadge = ({ badge }: { badge: DocsBadgeModel }) => (
  <span className={styles.badge} data-variant={badge.variant}>
    {badge.text}
  </span>
);

const ContextRowContent = ({ row }: { row: DocsContextRow }) => (
  <>
    <DocsIcon className={styles.contextIcon} name={row.icon} size={16} />
    <span className={styles.contextLabel}>{row.label}</span>
    {row.status && <DocsBadge badge={row.status} />}
    {row.meta && (
      <span className={cx(styles.meta, styles.contextMeta)}>{row.meta}</span>
    )}
  </>
);

const DocsContextMenu = ({ row }: { row: DocsContextRow }) => {
  const options = row.options ?? [];
  const [inputModality, setInputModality] = useState<"keyboard" | "pointer">(
    "pointer"
  );

  return (
    <Menu.Root modal={false}>
      <Menu.Trigger
        aria-label={row.ariaLabel}
        className={cx(styles.contextControl, styles.contextTrigger)}
        data-has-context-meta={row.meta ? "" : undefined}
        onKeyDown={() => setInputModality("keyboard")}
        onPointerDown={() => setInputModality("pointer")}
      >
        <ContextRowContent row={row} />
        <DocsIcon
          className={styles.chevron}
          name="down-caret"
          size={14}
          strokeWidth={0.75}
        />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          align="start"
          alignOffset={8}
          className={styles.selectorPositioner}
          collisionAvoidance={{
            align: "shift",
            fallbackAxisSide: "none",
            side: "shift",
          }}
          collisionPadding={8}
          side="bottom"
          sideOffset={4}
        >
          <Menu.Popup
            className={styles.selectorMenu}
            data-input-modality={inputModality}
            onKeyDownCapture={() => setInputModality("keyboard")}
            onPointerMoveCapture={() => setInputModality("pointer")}
          >
            {options.map((option) => (
              <Menu.LinkItem
                aria-current={option.selected ? "true" : undefined}
                className={styles.selectorOption}
                closeOnClick
                href={option.href}
                key={option.id}
                label={option.label}
              >
                <DocsIcon name={option.icon} size={16} />
                <span className={styles.selectorLabel}>{option.label}</span>
                {option.status && <DocsBadge badge={option.status} />}
                {(option.meta || option.selected) && (
                  <span className={styles.selectorTrailing}>
                    {option.meta && (
                      <span className={styles.meta}>{option.meta}</span>
                    )}
                    {option.selected && (
                      <DocsIcon name="approve-check" size={14} />
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
    className={styles.context}
    role="group"
  >
    <DocsContextMenu row={context.product} />
    {context.version &&
      (context.version.options ? (
        <DocsContextMenu row={context.version} />
      ) : (
        <div
          aria-label={context.version.ariaLabel}
          className={styles.contextControl}
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
  <ul className={styles.tree} data-top-level={nested ? undefined : ""}>
    {entries.map((entry) => {
      if (entry.type === "link") {
        return (
          <li key={entry.id}>
            <a
              {...entry.attrs}
              aria-current={entry.isCurrent ? "page" : undefined}
              className={cx(styles.navLink, entry.className)}
              data-docs-nav-link=""
              href={entry.href}
            >
              <span aria-hidden="true" className={styles.navIcon}>
                {entry.icon && <DocsIcon name={entry.icon} size={14} />}
              </span>
              <span className={styles.navLabel}>{entry.label}</span>
              {entry.badge && <DocsBadge badge={entry.badge} />}
            </a>
          </li>
        );
      }

      return (
        <Collapsible.Root
          data-docs-sidebar-group={entry.id}
          key={entry.id}
          onOpenChange={(open) => onOpenChange(entry.id, open)}
          open={openGroups.includes(entry.id)}
          render={<li />}
        >
          <Collapsible.Trigger
            className={styles.groupTrigger}
            data-docs-sidebar-trigger=""
          >
            <span className={styles.groupLabel}>
              <span>{entry.label}</span>
              {entry.badge && <DocsBadge badge={entry.badge} />}
            </span>
            <DocsIcon
              className={styles.chevron}
              name="down-caret"
              size={14}
              strokeWidth={0.75}
            />
          </Collapsible.Trigger>
          <Collapsible.Panel
            className={styles.collapsiblePanel}
            data-docs-sidebar-panel=""
          >
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
    () => collectDocsSidebarGroupIds(entries, (entry) => entry.containsCurrent),
    [entries]
  );
  const defaultOpenGroupIds = useMemo(
    () =>
      collectDocsSidebarGroupIds(
        entries,
        (entry) => entry.containsCurrent || !entry.collapsed
      ),
    [entries]
  );
  const allGroupIds = useMemo(
    () => new Set(collectDocsSidebarGroupIds(entries, () => true)),
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

        const scroller = getSidebarScroller();
        if (scroller) {
          scroller.scrollTop = storedState.scroll;
        }
      }
    }

    setOpenGroups(nextOpenGroups);

    const revealFrame = window.requestAnimationFrame(() => {
      setRestored(true);
    });

    return () => window.cancelAnimationFrame(revealFrame);
  }, [activeGroupIds, allGroupIds, defaultOpenGroupIds, sidebarHash]);

  useBrowserLayoutEffect(() => {
    if (!restored) {
      return;
    }

    document.getElementById(sidebarBootstrapStyleId)?.remove();
  }, [restored]);

  const storeState = useCallback(
    (groups: string[]) => {
      if (!window.matchMedia(desktopMediaQuery).matches) {
        return;
      }

      try {
        const scroller = getSidebarScroller();
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
      className={styles.root}
      data-docs-sidebar-root=""
      data-restoring={restored ? undefined : ""}
    >
      <DocsContext context={context} />
      {entries.length > 0 && (
        <div className={styles.navigation} data-docs-sidebar-scroll="">
          <SidebarList
            entries={entries}
            onOpenChange={handleOpenChange}
            openGroups={openGroups}
          />
        </div>
      )}
    </div>
  );
}
