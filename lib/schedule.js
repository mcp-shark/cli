import { createScan } from "./api.js";
import { transformServerResultForAPI } from "./transform.js";
import { isError } from "./error.js";

/**
 * Schedule scans for all servers
 * Returns an array of scan results, one per server
 * @param {object} apiClient - The API client instance
 * @param {Array|object} serverResults - Array of server results or single result
 * @param {object} logger - Optional logger instance (consola) for progress output
 * @param {boolean} json - Whether to suppress non-JSON output
 */
export async function scheduleScans(
  apiClient,
  serverResults,
  logger = null,
  json = false,
) {
  // Ensure we have an array
  const servers = Array.isArray(serverResults)
    ? serverResults
    : [serverResults];

  // Show progress for each server
  if (!json && logger) {
    logger.info(
      `Submitting ${servers.length} scan(s) to security analysis API...`,
    );
  }

  // Send one scan request per server
  const scanPromises = servers.map(async (serverResult, index) => {
    const serverName = serverResult.name || "unknown";

    // Show which server we're processing
    if (!json && logger) {
      logger.info(
        `[${index + 1}/${servers.length}] Sending scan request for server: ${serverName}`,
      );
    }

    const transformedData = transformServerResultForAPI(serverResult);
    const scanResult = await createScan(apiClient, transformedData);

    // Show completion status
    if (!json && logger) {
      if (isError(scanResult)) {
        logger.error(
          `[${index + 1}/${servers.length}] Scan failed for server: ${serverName}`,
        );
      } else {
        logger.success(
          `[${index + 1}/${servers.length}] Scan completed for server: ${serverName}`,
        );
      }
    }

    // Add server name to the result for identification
    if (!isError(scanResult)) {
      return {
        ...scanResult,
        server_name: serverName,
      };
    }

    // For errors, include server name in the error
    return {
      ...scanResult,
      server_name: serverName,
    };
  });

  const scanResults = await Promise.all(scanPromises);
  return scanResults;
}
