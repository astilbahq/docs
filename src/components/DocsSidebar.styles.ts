import { css, cx } from "../../styled-system/css";
import { menuStyles } from "./ui/Menu.styles";

export const docsSidebarStyles = {
  root: css({
    color: "ink.default",
  }),
  context: css({
    borderBlockWidth: "1px",
    borderBlockStyle: "solid",
    borderBlockColor: "border.chrome",
  }),
  contextControl: css({
    display: "flex",
    inlineSize: "100%",
    minBlockSize: "2.75rem",
    alignItems: "center",
    gap: "0.625rem",
    border: 0,
    borderBlockEndWidth: "1px",
    borderBlockEndStyle: "solid",
    borderBlockEndColor: "border.chrome",
    borderRadius: 0,
    paddingBlock: "0.5rem",
    paddingInline: "1rem",
    background: "transparent",
    color: "ink.default",
    font: "inherit",
    fontSize: "0.8125rem",
    textAlign: "start",
    _last: {
      borderBlockEndWidth: 0,
    },
    desktop: {
      minBlockSize: "2.5rem",
    },
  }),
  contextTrigger: css({
    cursor: "pointer",
    "&:is(:hover, :focus-visible, [data-popup-open])": {
      background: "surface.hover",
      color: "ink.strong",
    },
    _active: {
      background: "surface.pressed",
    },
    _focusVisible: {
      outlineColor: "signal",
      outlineOffset: "-0.125rem",
      outlineStyle: "solid",
      outlineWidth: "0.125rem",
    },
  }),
  contextIcon: css({
    flex: "0 0 auto",
  }),
  contextLabel: css({
    minInlineSize: 0,
    overflow: "hidden",
    color: "ink.strong",
    fontWeight: "medium",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  }),
  meta: css({
    color: "ink.muted",
    fontFamily: "var(--sl-font-mono), ui-monospace, monospace",
    fontSize: "0.6875rem",
  }),
  contextMeta: css({
    marginInlineStart: "auto",
  }),
  chevron: css({
    flex: "0 0 auto",
    marginInlineStart: "auto",
    color: "ink.muted",
    transform: "rotate(0deg)",
    transformOrigin: "center",
    transitionProperty: "transform",
    transitionDuration: "control",
    transitionTimingFunction: "outExpo",
    "[data-has-context-meta] > &": {
      marginInlineStart: 0,
    },
    "[data-popup-open] > &, [data-panel-open] &": {
      transform: "rotate(180deg)",
    },
    "& path": {
      vectorEffect: "non-scaling-stroke",
    },
    "[data-docs-sidebar-root][data-restoring] &": {
      transition: "none",
    },
    _reducedMotion: {
      transitionDuration: "instant",
    },
  }),
  selectorPositioner: cx(menuStyles.positioner, css({
    inlineSize: "calc(var(--anchor-width) - 1rem)",
  })),
  selectorMenu: cx(menuStyles.popup, css({
    inlineSize: "100%",
  })),
  selectorOption: cx(menuStyles.item, css({
    minBlockSize: "2.75rem",
    fontSize: "0.875rem",
    '&[aria-current="true"]': {
      background: "surface.selected",
      color: "ink.strong",
      fontWeight: "medium",
    },
    '&[aria-current="true"]:is(:hover, [data-highlighted])': {
      background: "surface.selected",
    },
    desktop: {
      minBlockSize: "2.5rem",
    },
  })),
  selectorLabel: menuStyles.label,
  selectorTrailing: menuStyles.trailing,
  badge: css({
    display: "inline-flex",
    flex: "0 0 auto",
    alignItems: "center",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.subtle",
    borderRadius: "badge",
    paddingBlock: "0.125rem",
    paddingInline: "0.375rem",
    background: "transparent",
    color: "ink.muted",
    fontFamily: "var(--sl-font-mono), ui-monospace, monospace",
    fontSize: "0.625rem",
    lineHeight: 1,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    "[data-docs-nav-link] > &": {
      marginInlineStart: "auto",
    },
  }),
  tree: css({
    margin: 0,
    padding: 0,
    listStyle: "none",
    "& li": {
      overflowWrap: "anywhere",
    },
  }),
  groupTrigger: css({
    display: "flex",
    inlineSize: "100%",
    minBlockSize: "2.75rem",
    alignItems: "center",
    justifyContent: "space-between",
    border: 0,
    borderBlockEndWidth: "1px",
    borderBlockEndStyle: "solid",
    borderBlockEndColor: "border.chrome",
    borderRadius: 0,
    paddingBlock: "0.5rem",
    paddingInline: "1rem",
    background: "transparent",
    color: "ink.default",
    font: "inherit",
    fontSize: "0.8125rem",
    fontWeight: "medium",
    textAlign: "start",
    cursor: "pointer",
    userSelect: "none",
    "&:is(:hover, :focus-visible)": {
      background: "surface.hover",
      color: "ink.strong",
    },
    _focusVisible: {
      outlineColor: "signal",
      outlineOffset: "-0.125rem",
      outlineStyle: "solid",
      outlineWidth: "0.125rem",
    },
    desktop: {
      minBlockSize: "2.5rem",
    },
  }),
  groupLabel: css({
    display: "flex",
    minInlineSize: 0,
    alignItems: "center",
    gap: "0.375rem",
  }),
  collapsiblePanel: css({
    display: "grid",
    gridTemplateRows: "1fr",
    transitionProperty: "grid-template-rows",
    transitionDuration: "disclosure",
    transitionTimingFunction: "outQuint",
    "& > ul": {
      minBlockSize: 0,
      overflow: "hidden",
      opacity: 1,
      filter: "blur(0)",
      transitionProperty: "opacity, filter",
      transitionDuration: "disclosure",
      transitionTimingFunction: "outQuint",
    },
    _startingStyle: {
      gridTemplateRows: "0fr",
      "& > ul": {
        opacity: 0,
        filter: "blur(var(--astilba-blurs-disclosure))",
      },
    },
    _endingStyle: {
      gridTemplateRows: "0fr",
      "& > ul": {
        opacity: 0,
        filter: "blur(var(--astilba-blurs-disclosure))",
      },
    },
    "[data-docs-sidebar-root][data-restoring] &": {
      transition: "none",
      "& > ul": {
        transition: "none",
      },
    },
    _reducedMotion: {
      transitionDuration: "instant",
      "& > ul": {
        transitionDuration: "instant",
      },
    },
  }),
  navLink: css({
    display: "flex",
    minBlockSize: "2.75rem",
    alignItems: "center",
    gap: "0.625rem",
    paddingBlock: "0.5rem",
    paddingInline: "1rem",
    borderRadius: 0,
    color: "ink.muted",
    fontSize: "0.875rem",
    fontWeight: "regular",
    lineHeight: 1.35,
    textDecoration: "none",
    "&:is(:hover, :focus-visible)": {
      background: "surface.subtle",
      color: "ink.strong",
    },
    '&[aria-current="page"]': {
      background: "surface.selected",
      color: "ink.strong",
      fontWeight: "medium",
    },
    '&[aria-current="page"]:is(:hover, :focus-visible)': {
      background: "surface.selected",
      color: "ink.strong",
      fontWeight: "medium",
    },
    _focusVisible: {
      outlineColor: "signal",
      outlineOffset: "-0.125rem",
      outlineStyle: "solid",
      outlineWidth: "0.125rem",
    },
    desktop: {
      minBlockSize: "2rem",
      paddingBlock: "0.35rem",
    },
  }),
  navIcon: css({
    display: "grid",
    flex: "0 0 1rem",
    placeItems: "center",
    color: "ink.muted",
    '[data-docs-nav-link]:is(:hover, :focus-visible, [aria-current="page"]) &': {
      color: "currentColor",
    },
  }),
  navLabel: css({
    minInlineSize: 0,
  }),
};
