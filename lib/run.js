import { makeTransport } from "./transport.js";
import { normalizeConfig } from "./config.js";
import { createClient, closeClient } from "./client.js";
import * as requests from "./request.js";
import { isError, MCPError, getErrors } from "./error.js";

export class RunError extends MCPError {
  constructor(message, error, errors = []) {
    super("RunError", message, error);
    this.errors = errors;
  }
}

export async function runServer({ logger, name, config }) {
  logger.debug(`Starting MCP run for server ${name} with config:`, config);

  // Create transport
  const transport = makeTransport(config);
  if (isError(transport)) {
    return new RunError(
      `Error creating transport for server ${name}`,
      transport.error,
    );
  }

  // Create client
  const client = await createClient({ transport });
  if (isError(client)) {
    return new RunError(
      `Error creating client for server ${name}`,
      client.error,
    );
  }

  // Run requests
  const allResults = [
    requests.listTools(client),
    requests.listResources(client),
    requests.listPrompts(client),
  ];
  const results = await Promise.allSettled(allResults);
  // Close client
  const closeResult = await closeClient(client);
  if (isError(closeResult)) {
    return new RunError(
      `Error closing client for server ${name}`,
      closeResult.error,
    );
  }

  // Check for errors
  const errors = getErrors(results);
  if (errors.length > 0) {
    return new RunError(
      `Errors occurred while running requests for server ${name}`,
      null,
      errors,
    );
  }

  const [{ tools }, { resources }, { prompts }] = results.map(
    (result) => result.value,
  );
  return {
    name,
    tools,
    resources,
    prompts,
  };
}

export async function runAllServers(logger, parsedConfig) {
  const configs = normalizeConfig(parsedConfig);
  if (isError(configs)) {
    return configs; // Return ConfigError directly
  }
  const results = await Promise.all(
    Object.entries(configs).map(([name, config]) =>
      runServer({ logger, name, config }),
    ),
  );

  const errors = getErrors(results.flat());
  if (errors.length > 0) {
    return new RunError(
      "Errors occurred while running all servers",
      null,
      errors,
    );
  }
  return results.flat();
}
