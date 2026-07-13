import { css } from "../../../styled-system/css";

export const menuStyles = {
  positioner: css({
    zIndex: "var(--sl-z-index-menu)",
    maxInlineSize: "calc(100vi - 1rem)",
  }),
  popup: css({
    boxSizing: "border-box",
    maxBlockSize: "min(var(--available-height), 24rem)",
    overflowBlock: "auto",
    borderWidth: 0,
    borderRadius: 0,
    padding: "menuInset",
    background: "surface.elevated",
    color: "ink.default",
    boxShadow: "elevated",
    outline: 0,
    transformOrigin: "var(--transform-origin)",
    transform: "scale(1)",
    transitionProperty: "transform, opacity",
    transitionDuration: "menuOpen",
    transitionTimingFunction: "outQuint",
    _startingStyle: {
      opacity: 0,
      transform: "scale(0.97)",
    },
    _endingStyle: {
      opacity: 0,
      transform: "scale(0.99)",
      transitionDuration: "menuClose",
    },
    '&[data-input-modality="keyboard"]:focus-visible': {
      outlineColor: "signal",
      outlineOffset: "0.125rem",
      outlineStyle: "solid",
      outlineWidth: "0.125rem",
    },
    _reducedMotion: {
      transitionDuration: "instant",
    },
  }),
  item: css({
    display: "flex",
    minBlockSize: "2.5rem",
    alignItems: "center",
    gap: "0.625rem",
    paddingBlock: "0.5rem",
    paddingInline: "0.75rem",
    color: "ink.default",
    fontSize: "0.8125rem",
    fontWeight: "regular",
    textDecoration: "none",
    outline: 0,
    cursor: "pointer",
    "&:is(:hover, [data-highlighted])": {
      background: "surface.highlight",
      color: "ink.strong",
    },
    '[data-input-modality="keyboard"] &': {
      _highlighted: {
        outlineColor: "signal",
        outlineOffset: "-0.125rem",
        outlineStyle: "solid",
        outlineWidth: "0.125rem",
      },
    },
  }),
  label: css({
    minInlineSize: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  }),
  trailing: css({
    display: "flex",
    flex: "0 0 auto",
    alignItems: "center",
    gap: "0.625rem",
    marginInlineStart: "auto",
  }),
};
