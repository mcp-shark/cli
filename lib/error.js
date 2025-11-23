export class MCPError extends Error {
  constructor(name, message, error) {
    super(name, message);
    this.name = name;
    this.error = error;
  }
}

export function isError(error) {
  return error instanceof MCPError;
}

export function getErrors(results) {
  return results.filter((result) => isError(result));
}
