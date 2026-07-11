import { cva } from "../../styled-system/css";

export const ghostControl = cva({
  base: {
    position: "relative",
    display: "inline-flex",
    minInlineSize: "2rem",
    blockSize: "2rem",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.4375rem",
    border: 0,
    borderRadius: 0,
    paddingInline: "0.625rem",
    background: "transparent",
    color: "ink.muted",
    cursor: "pointer",
    fontSize: "0.8125rem",
    fontWeight: "medium",
    lineHeight: 1,
    textDecoration: "none",
    whiteSpace: "nowrap",
    _hover: {
      background: "surface.hover",
      color: "ink.strong",
    },
    _focusVisible: {
      background: "surface.hover",
      color: "ink.strong",
      outlineColor: "signal",
      outlineOffset: "-0.125rem",
      outlineStyle: "solid",
      outlineWidth: "0.125rem",
    },
    _active: {
      background: "surface.pressed",
    },
  },
  variants: {
    iconOnly: {
      true: {
        inlineSize: "2rem",
        paddingInline: 0,
      },
    },
  },
});
