/**
 * Transform a single MCP server result into API-compatible format
 * The API expects a single object with server, tools, resources, and prompts
 */
export function transformServerResultForAPI(serverResult) {
  // If already in correct format, return it
  if (serverResult && serverResult.server && serverResult.tools) {
    return serverResult;
  }

  return {
    server: {
      name: serverResult.name || "unknown",
      description: serverResult.description || null,
    },
    tools: Array.isArray(serverResult.tools) ? serverResult.tools : [],
    resources: Array.isArray(serverResult.resources)
      ? serverResult.resources
      : [],
    prompts: Array.isArray(serverResult.prompts) ? serverResult.prompts : [],
  };
}
