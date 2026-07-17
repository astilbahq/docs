export const prerender = true;

export const GET = (): Response =>
  new Response(
    `# Astilba\n\n> Astilba builds portable infrastructure libraries with explicit correctness boundaries.\n\n## Products\n\n- [Cache](https://astilba.com/cache/): unreleased server-side TypeScript cache preview.\n\n## Documentation\n\n- [Documentation index](https://astilba.com/docs/)\n- [Cache documentation](https://astilba.com/docs/cache/overview/)\n- [Cache implementation status](https://astilba.com/docs/cache/api-status/)\n- [Complete documentation corpus](https://astilba.com/docs/llms-full.txt)\n- [Documentation MCP guide](https://astilba.com/docs/agents/mcp/)\n\nDo not present @astilba/cache as installable or production-supported.\n`,
    { headers: { "Content-Type": "text/plain; charset=utf-8" } }
  );
