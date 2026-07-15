import { defineConfig } from "@pandacss/dev";

const themedColor = (dark: string, light: string) => ({
  value: { base: dark, _light: light },
});

const themeColorValues = {
  dark: {
    signal: "oklch(0.72 0.17 32)",
    ink: "#ffffff",
    canvas: "#121212",
    accentLow: "oklch(0.22 0.04 32)",
    accentHigh: "oklch(0.91 0.04 32)",
  },
  light: {
    signal: "oklch(0.55 0.19 32)",
    ink: "#0d0d0d",
    canvas: "#fdfdfd",
    accentLow: "oklch(0.95 0.025 32)",
    accentHigh: "oklch(0.35 0.13 32)",
  },
} as const;

export default defineConfig({
  preflight: false,
  presets: ["@pandacss/preset-base"],
  prefix: "astilba",
  hash: false,
  cssVarRoot: ":root",
  jsxFramework: "react",
  include: ["./src/**/*.{astro,js,jsx,ts,tsx}"],
  exclude: ["./dist/**", "./styled-system/**"],
  outdir: "styled-system",
  clean: true,
  validation: "error",
  layers: {
    reset: "astilba.reset",
    base: "astilba.base",
    tokens: "astilba.tokens",
    recipes: "astilba.recipes",
    utilities: "astilba.utilities",
  },
  conditions: {
    extend: {
      dark: ':root:not([data-theme="light"]) &',
      light: ':root[data-theme="light"] &',
      narrow: "@media (max-width: 30rem)",
      popupOpen: "&[data-popup-open]",
      panelOpen: "&[data-panel-open]",
      highlighted: "&[data-highlighted]",
      currentPage: '&[aria-current="page"]',
      currentTrue: '&[aria-current="true"]',
      startingStyle: "&[data-starting-style]",
      endingStyle: "&[data-ending-style]",
      reducedMotion: "@media (prefers-reduced-motion: reduce)",
    },
  },
  theme: {
    extend: {
      breakpoints: {
        desktop: "50rem",
        wide: "72rem",
      },
      tokens: {
        fonts: {
          body: { value: '"Geist Variable"' },
          heading: { value: '"Inter Variable"' },
          mono: { value: '"JetBrains Mono Variable"' },
        },
        fontWeights: {
          regular: { value: "400" },
          medium: { value: "500" },
          semibold: { value: "600" },
          brand: { value: "650" },
        },
        shadows: {
          none: { value: "none" },
        },
        blurs: {
          chrome: { value: "0.75rem" },
          disclosure: { value: "2px" },
          iconSwap: { value: "2px" },
        },
        durations: {
          instant: { value: "0.01ms" },
          fast: { value: "160ms" },
          control: { value: "180ms" },
          modalOpen: { value: "250ms" },
          modalClose: { value: "150ms" },
          menuOpen: { value: "250ms" },
          menuClose: { value: "150ms" },
          disclosure: { value: "250ms" },
          iconSwap: { value: "250ms" },
        },
        easings: {
          inOut: { value: "ease-in-out" },
          outExpo: { value: "cubic-bezier(0.16, 1, 0.3, 1)" },
          outQuint: { value: "cubic-bezier(0.22, 1, 0.36, 1)" },
        },
        radii: {
          badge: { value: "0.25rem" },
          codeBlock: { value: "0" },
          inlineCode: { value: "0.375rem" },
        },
      },
      semanticTokens: {
        colors: {
          signal: themedColor(
            themeColorValues.dark.signal,
            themeColorValues.light.signal
          ),
          ink: {
            strong: themedColor(
              themeColorValues.dark.ink,
              themeColorValues.light.ink
            ),
            default: themedColor("#ffffff", "#0d0d0d"),
            muted: themedColor("rgba(202, 202, 202, 0.7)", "#6c6c6c"),
            subtle: themedColor("#767676", "#767676"),
            faint: themedColor("#8f8f8f", "#8f8f8f"),
            control: themedColor("#ededed", "#0d0d0d"),
            secondary: themedColor("rgba(202, 202, 202, 0.7)", "#6c6c6c"),
            onBanner: themedColor("#e3e3e3", "#17181c"),
            inverse: themedColor(
              themeColorValues.dark.canvas,
              themeColorValues.light.canvas
            ),
          },
          canvas: themedColor(
            themeColorValues.dark.canvas,
            themeColorValues.light.canvas
          ),
          accent: {
            DEFAULT: themedColor(
              themeColorValues.dark.signal,
              themeColorValues.light.signal
            ),
            low: themedColor(
              themeColorValues.dark.accentLow,
              themeColorValues.light.accentLow
            ),
            high: themedColor(
              themeColorValues.dark.accentHigh,
              themeColorValues.light.accentHigh
            ),
          },
          border: {
            strong: themedColor(
              "rgba(196, 196, 196, 0.08)",
              "rgba(0, 0, 0, 0.06)"
            ),
            DEFAULT: themedColor(
              "rgba(196, 196, 196, 0.08)",
              "rgba(0, 0, 0, 0.06)"
            ),
            subtle: themedColor(
              "rgba(255, 255, 255, 0.02)",
              "rgba(0, 0, 0, 0.04)"
            ),
            guide: themedColor("#767676", "#8f8f8f"),
            structure: themedColor(
              "rgba(196, 196, 196, 0.08)",
              "rgba(0, 0, 0, 0.06)"
            ),
            chrome: themedColor(
              "rgba(255, 255, 255, 0.08)",
              "rgba(0, 0, 0, 0.07)"
            ),
            overlay: themedColor(
              "rgba(196, 196, 196, 0.08)",
              "rgba(0, 0, 0, 0.06)"
            ),
          },
          surface: {
            elevated: {
              description:
                "Raised surfaces such as callouts, dialogs, and popovers.",
              value: {
                base: "#181818",
                _light: "#ffffff",
              },
            },
            quiet: themedColor("#131313", "#f9f9f9"),
            recessed: themedColor("rgba(255, 255, 255, 0.07)", "#f4f4f4"),
            banner: themedColor(
              "rgba(255, 255, 255, 0.04)",
              "rgba(243, 243, 243, 0.9)"
            ),
            subtle: themedColor(
              "rgba(255, 255, 255, 0.04)",
              "rgba(0, 0, 0, 0.02)"
            ),
            hover: themedColor(
              "rgba(255, 255, 255, 0.06)",
              "rgba(0, 0, 0, 0.02)"
            ),
            highlight: themedColor(
              "rgba(255, 255, 255, 0.06)",
              "rgba(0, 0, 0, 0.02)"
            ),
            selected: themedColor("rgba(255, 255, 255, 0.07)", "#f4f4f4"),
            pressed: themedColor("rgba(255, 255, 255, 0.08)", "#eae9e9"),
            copy: {
              DEFAULT: themedColor("transparent", "transparent"),
              hover: themedColor(
                "rgba(255, 255, 255, 0.1)",
                "rgba(0, 0, 0, 0.04)"
              ),
              pressed: themedColor(
                "rgba(255, 255, 255, 0.1)",
                "rgba(0, 0, 0, 0.06)"
              ),
            },
            chrome: themedColor(
              "rgba(18, 18, 18, 0.85)",
              "rgba(255, 255, 255, 0.85)"
            ),
            inlineCode: themedColor(
              "rgba(255, 255, 255, 0.07)",
              "rgba(0, 0, 0, 0.04)"
            ),
            codeBlock: themedColor("#181818", "#f7f7f7"),
            kbd: themedColor("rgba(255, 255, 255, 0.07)", "#f4f4f4"),
            selection: themedColor(
              `color-mix(in oklab, ${themeColorValues.dark.signal} 32%, transparent)`,
              `color-mix(in oklab, ${themeColorValues.light.signal} 32%, transparent)`
            ),
            scrim: themedColor(
              "hsla(223, 13%, 10%, 0.66)",
              "hsla(225, 9%, 36%, 0.66)"
            ),
          },
          link: {
            DEFAULT: themedColor(
              themeColorValues.dark.ink,
              themeColorValues.light.ink
            ),
            hover: themedColor(
              themeColorValues.dark.signal,
              themeColorValues.light.signal
            ),
          },
          callout: {
            note: {
              accent: themedColor("hsl(234, 100%, 60%)", "hsl(234, 90%, 60%)"),
              foreground: themedColor(
                "hsl(234, 100%, 87%)",
                "hsl(234, 80%, 30%)"
              ),
            },
            tip: {
              accent: themedColor("hsl(281, 82%, 63%)", "hsl(281, 90%, 60%)"),
              foreground: themedColor(
                "hsl(281, 82%, 89%)",
                "hsl(281, 90%, 30%)"
              ),
            },
            caution: {
              accent: themedColor("hsl(41, 82%, 63%)", "hsl(41, 90%, 60%)"),
              foreground: themedColor("hsl(41, 82%, 87%)", "hsl(41, 80%, 25%)"),
            },
            danger: {
              accent: themedColor("hsl(339, 82%, 63%)", "hsl(339, 90%, 60%)"),
              foreground: themedColor(
                "hsl(339, 82%, 87%)",
                "hsl(339, 80%, 30%)"
              ),
            },
          },
        },
        shadows: {
          elevated: {
            description:
              "Raised surfaces such as callouts, dialogs, and popovers.",
            value: {
              base: "0 1px 3px 0 rgba(0, 0, 0, 0.04), inset 0 1px 0 0 rgba(255, 255, 255, 0.04), inset 0 0 0 1px rgba(0, 0, 0, 0.06), inset 0 -1px 0 0 rgba(0, 0, 0, 0.06), inset 0 0 0 1px rgba(196, 196, 196, 0.08)",
              _light:
                "0 0 0 1px rgba(0, 0, 0, 0.06), 0 2px 6px 0 rgba(0, 0, 0, 0.05), 0 4px 42px 0 rgba(0, 0, 0, 0.06)",
            },
          },
          overlay: {
            value: {
              base: "0 1px 3px 0 rgba(0, 0, 0, 0.04), inset 0 1px 0 0 rgba(255, 255, 255, 0.04), inset 0 0 0 1px rgba(0, 0, 0, 0.06), inset 0 -1px 0 0 rgba(0, 0, 0, 0.06), inset 0 0 0 1px rgba(196, 196, 196, 0.08)",
              _light:
                "0 0 0 1px rgba(0, 0, 0, 0.06), 0 2px 6px 0 rgba(0, 0, 0, 0.05), 0 4px 42px 0 rgba(0, 0, 0, 0.06)",
            },
          },
        },
        radii: {
          elevated: {
            description:
              "Raised surfaces such as callouts, dialogs, and popovers.",
            value: "0px",
          },
        },
        spacing: {
          elevatedInset: {
            description:
              "Interior spacing for raised surfaces such as callouts, dialogs, and popovers.",
            value: "16px",
          },
          menuInset: {
            description: "Interior spacing for compact popup menus.",
            value: "4px",
          },
          tocInset: {
            description:
              "Horizontal separation between article content and the page table of contents.",
            value: "2rem",
          },
        },
      },
    },
  },
});
