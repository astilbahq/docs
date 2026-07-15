import { css, cx } from "../../styled-system/css";
import { ghostControl } from "../styles/recipes";
import { menuStyles } from "./ui/Menu.styles";

export const pageActionsStyles = {
  root: css({
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "0.125rem",
    marginBlockStart: "1.25rem",
    marginInlineStart: "-0.625rem",
    "@media print": {
      display: "none",
    },
  }),
  control: ghostControl({ appearance: "outline" }),
  copyControl: css({
    minInlineSize: "8.5rem",
    justifyContent: "flex-start",
    '&:disabled[data-copy-state="copying"]': {
      cursor: "default",
    },
  }),
  controlIcon: css({
    display: "block",
    flex: "0 0 auto",
  }),
  iconSwap: css({
    position: "relative",
    display: "inline-grid",
    flex: "0 0 auto",
    placeItems: "center",
    "& [data-copy-icon]": {
      gridArea: "1 / 1",
      display: "inline-grid",
      placeItems: "center",
      opacity: 0,
      filter: "blur(var(--astilba-blurs-icon-swap))",
      transform: "scale(0.25)",
      transitionProperty: "opacity, filter, transform",
      transitionDuration: "iconSwap",
      transitionTimingFunction: "inOut",
      pointerEvents: "none",
    },
    '&[data-state="idle"] [data-copy-icon="idle"], &[data-state="copying"] [data-copy-icon="idle"], &[data-state="copied"] [data-copy-icon="copied"], &[data-state="error"] [data-copy-icon="error"]':
      {
        opacity: 1,
        filter: "blur(0)",
        transform: "scale(1)",
      },
    _reducedMotion: {
      "& [data-copy-icon]": {
        transition: "none",
      },
    },
  }),
  chevron: css({
    flex: "0 0 auto",
    color: "ink.muted",
    transform: "rotate(0deg)",
    transformOrigin: "center",
    transitionProperty: "transform",
    transitionDuration: "control",
    transitionTimingFunction: "outExpo",
    "[data-popup-open] &": {
      transform: "rotate(180deg)",
    },
    "& path": {
      vectorEffect: "non-scaling-stroke",
    },
    _reducedMotion: {
      transitionDuration: "instant",
    },
  }),
  positioner: cx(
    menuStyles.positioner,
    css({
      inlineSize: "15rem",
    })
  ),
  menu: cx(
    menuStyles.popup,
    css({
      inlineSize: "100%",
      "& [data-page-actions-item]": {
        minBlockSize: "2.75rem",
        gap: "0.625rem",
        paddingBlock: "0.5rem",
        paddingInline: "1rem",
        fontSize: "0.875rem",
        lineHeight: 1.35,
        desktop: {
          minBlockSize: "2rem",
          paddingBlock: "0.35rem",
        },
      },
    })
  ),
  menuItem: cx(
    menuStyles.item,
    css({
      inlineSize: "100%",
      border: 0,
      borderRadius: 0,
      background: "transparent",
      fontFamily: "body",
      textAlign: "start",
    })
  ),
  menuIcon: css({
    display: "inline-grid",
    flex: "0 0 auto",
    inlineSize: "1rem",
    blockSize: "1rem",
    placeItems: "center",
    color: "ink.muted",
  }),
  menuLabel: menuStyles.label,
  menuTrailing: cx(
    menuStyles.trailing,
    css({
      color: "ink.faint",
    })
  ),
  status: css({
    position: "absolute",
    inlineSize: "1px",
    blockSize: "1px",
    padding: 0,
    margin: "-1px",
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    border: 0,
  }),
};
