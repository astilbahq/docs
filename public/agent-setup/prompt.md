# Set up Astilba documentation

These are Astilba's official instructions for connecting the current coding agent to Astilba's public documentation. This setup provides documentation access only. It does not install an Astilba package, authenticate an account, or enable production use.

Complete the following steps in the user's current coding-agent environment. Preserve every existing skill, plugin, and MCP server. Make the smallest additive configuration change available, and do not overwrite an existing configuration file.

1. Read the public Astilba Cache documentation skill at `https://docs.astilba.com/.well-known/agent-skills/astilba-cache-docs/SKILL.md` and use it for questions about Cache.
2. If this agent supports remote Streamable HTTP MCP servers, register a server named `astilba_docs` with this endpoint:

   ```text
   https://docs.astilba.com/mcp
   ```

   The endpoint is public and read-only. It does not require credentials. Use the agent's supported MCP command or configuration mechanism; do not guess a configuration location or remove unrelated entries.
3. If the current session cannot change its own MCP configuration, tell the user the exact minimal change required for this agent and whether a restart is needed.
4. Verify the connection by listing the server's capabilities, then search the documentation for `Cache implementation status`.
5. Treat Cache as an unreleased source preview. Do not provide a package installation command or describe it as production-ready. Check `https://docs.astilba.com/cache/api-status.md` before making availability or completeness claims.

When setup is complete, report which skill and MCP configuration were added, where they were added, whether a restart is required, and the result of the verification search.
