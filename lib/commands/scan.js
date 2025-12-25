import { consola } from "consola";
import { createApiClient } from "../api.js";
import { displayTestingBanner } from "../banner.js";
import { isError } from "../error.js";
import { formatScanJSON, formatScanTable, getExitCode } from "../formatter.js";
import { runAllServers } from "../run.js";
import { scheduleScans } from "../schedule.js";

export async function handleScanCommand({
  config,
  token,
  verbose,
  json,
  failOnHigh,
  failOnMedium,
  failOnLow,
  getToken,
}) {
  // Display testing phase banner immediately (skip in JSON mode)
  if (!json) {
    displayTestingBanner();
  }

  const tokenValue = getToken(token);

  // Configure logger verbosity
  if (verbose) {
    consola.level = 4; // Verbose mode
  }

  if (!json) {
    consola.info(`Running scan with config: ${config}`);
    consola.debug(`Token: ${tokenValue.substring(0, 8)}...`);
    if (verbose) {
      consola.debug("Verbose mode enabled");
    }
  }

  const apiClient = createApiClient(tokenValue);
  if (isError(apiClient)) {
    if (json) {
      console.error(
        JSON.stringify(
          {
            error: "Failed to create API client",
            details: apiClient.error,
          },
          null,
          2
        )
      );
    } else {
      consola.error("Error creating API client:", apiClient.error);
    }
    process.exit(1);
  }

  // Run MCP servers to discover capabilities
  if (!json) {
    consola.info("Discovering MCP server capabilities...");
  }
  const runResult = await runAllServers(consola, config);
  if (isError(runResult)) {
    if (json) {
      const errorDetails = {
        error: "Failed to run MCP servers",
        message: runResult.message,
        details: runResult.error,
      };
      // Include errors array if it's a RunError
      if (runResult.errors && Array.isArray(runResult.errors)) {
        errorDetails.errors = runResult.errors.map((err) => ({
          message: err.message,
          error: err.error,
          name: err.name,
        }));
      }
      console.error(JSON.stringify(errorDetails, null, 2));
    } else {
      consola.error("Error running MCP servers:", runResult.message || runResult.error);
      // Display individual errors if available
      if (runResult.errors && Array.isArray(runResult.errors)) {
        runResult.errors.forEach((err, index) => {
          consola.error(`  Error ${index + 1}: ${err.message || err.name}`);
          if (err.error) {
            consola.error(`    Details: ${err.error.message || err.error}`);
          }
        });
      }
    }
    process.exit(1);
  }
  if (!json) {
    consola.debug("Fetched MCP results:", JSON.stringify(runResult, null, 2));
  }

  // Perform scans (one per server)
  const scanResults = await scheduleScans(apiClient, runResult, consola, json);

  // Check if all scans failed
  const allFailed = scanResults.every((result) => isError(result) || result.is_error);
  if (allFailed && scanResults.length > 0) {
    if (json) {
      console.error(JSON.stringify({ error: "All scans failed", details: scanResults }, null, 2));
    } else {
      consola.error("All scans failed. See details below.");
    }
    process.exit(1);
  }

  // Format output
  if (json) {
    console.log(formatScanJSON(scanResults));
  } else {
    formatScanTable(scanResults);
  }

  // Determine exit code
  const exitCode = getExitCode(scanResults, {
    failOnHigh: failOnHigh !== undefined ? failOnHigh : true,
    failOnMedium: failOnMedium || false,
    failOnLow: failOnLow || false,
  });

  if (exitCode !== 0 && !json) {
    const failedCount = scanResults.filter((r) => isError(r) || r.is_error).length;
    if (failedCount > 0) {
      consola.warn(`${failedCount} of ${scanResults.length} scan(s) failed`);
    } else {
      consola.warn(`Scan completed with risk level that triggers failure (exit code: ${exitCode})`);
    }
  }

  process.exit(exitCode);
}
