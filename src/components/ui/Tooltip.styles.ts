import { css } from "../../../styled-system/css";

export const tooltipStyles = {
  labels: css({
    display: "inline-grid",
    "& [data-tooltip-label]": {
      gridArea: "1 / 1",
    },
    '& [data-tooltip-label="active"]': {
      justifySelf: "center",
      opacity: 0,
      visibility: "hidden",
    },
    '&[data-active="true"] [data-tooltip-label="idle"]': {
      opacity: 0,
      visibility: "hidden",
    },
    '&[data-active="true"] [data-tooltip-label="active"]': {
      opacity: 1,
      visibility: "visible",
    },
  }),
  popup: css({
    zIndex: "var(--sl-z-index-menu)",
    display: "inline-grid",
    paddingBlock: "0.375rem",
    paddingInline: "0.5rem",
    background: "surface.elevated",
    boxShadow: "elevated",
    color: "ink.control",
    fontFamily: "body",
    fontSize: "0.75rem",
    fontWeight: "medium",
    lineHeight: 1,
    opacity: 1,
    whiteSpace: "nowrap",
    transform: "scale(1)",
    transformOrigin: "50% 100%",
    transitionDuration: "tooltipOpen",
    transitionProperty: "opacity, transform",
    transitionTimingFunction: "outExpo",
    willChange: "opacity, transform",
    _startingStyle: {
      opacity: 0,
      transform: "scale(0.96)",
    },
    _endingStyle: {
      opacity: 0,
      transform: "scale(0.96)",
      transitionDuration: "tooltipClose",
    },
    _reducedMotion: {
      transition: "none",
    },
  }),
  positioner: css({
    zIndex: "var(--sl-z-index-menu)",
  }),
};
