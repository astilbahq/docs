// @ts-check
import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import { docsSidebar } from "./src/docs/catalog.ts";

export default defineConfig({
  integrations: [
    react(),
    starlight({
      title: "Astilba",
      description: "Documentation for Astilba infrastructure libraries.",
      favicon: "/favicon.svg",
      logo: {
        dark: "./src/assets/astilba-logomark-light.svg",
        light: "./src/assets/astilba-logomark-dark.svg",
      },
      social: [
        {
          icon: "github",
          label: "Astilba on GitHub",
          href: "https://github.com/astilbahq",
        },
      ],
      customCss: [
        "@fontsource-variable/inter",
        "@fontsource-variable/geist",
        "@fontsource-variable/jetbrains-mono",
        "./src/styles/panda.css",
        "./src/styles/starlight.css",
      ],
      components: {
        Banner: "./src/components/VersionBanner.astro",
        Header: "./src/components/Header.astro",
        PageTitle: "./src/components/PageTitle.astro",
        Sidebar: "./src/components/Sidebar.astro",
      },
      lastUpdated: false,
      routeMiddleware: "./src/docs/route-middleware.ts",
      sidebar: docsSidebar,
    }),
  ],
});
