import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { MCPError } from "./error.js";

const DEFAULT_VERSION = "1.0.0";
const DEFAULT_NAME = "mcpshark-client";
const DEFAULT_CAPABILITIES = {};
export class ClientError extends MCPError {
  constructor(message, error) {
    super("ClientError", message, error);
  }
}

export async function createClient({
  name = DEFAULT_NAME,
  version = DEFAULT_VERSION,
  capabilities = DEFAULT_CAPABILITIES,
  transport,
}) {
  const client = new Client({ name, version }, { capabilities });

  try {
    await client.connect(transport);
    return client;
  } catch (error) {
    return new ClientError("Failed to connect to server", error);
  }
}

export async function closeClient(client) {
  try {
    await client.close();
  } catch (error) {
    return new ClientError("Failed to close client", error);
  }
}
