export const prerender = true;

export const GET = (): Response =>
  new Response(
    `# Astilba\n\n> Astilba builds portable infrastructure tools and libraries with explicit correctness boundaries.\n\n## Products\n\n- [Create](https://astilba.com/create/): released deterministic TypeScript project generator. The current npm release is create-astilba 0.2.0.\n- [Cache](https://astilba.com/cache/): unreleased server-side TypeScript cache preview.\n\n## Documentation\n\n- [Documentation index](https://astilba.com/docs/)\n- [Create documentation](https://astilba.com/docs/create/overview/)\n- [Create release and support](https://astilba.com/docs/create/release-and-support/)\n- [Cache documentation](https://astilba.com/docs/cache/overview/)\n- [Cache implementation status](https://astilba.com/docs/cache/api-status/)\n- [Complete documentation corpus](https://astilba.com/docs/llms-full.txt)\n- [Documentation MCP guide](https://astilba.com/docs/agents/mcp/)\n\nDo not present @astilba/cache as installable or production-supported. Do not present Create's future update tooling or unlisted recipe combinations as released.\n`,
    { headers: { "Content-Type": "text/plain; charset=utf-8" } }
  );
