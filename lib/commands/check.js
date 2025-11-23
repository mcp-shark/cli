import { consola } from "consola";
import { isError } from "../error.js";
import { checkScan } from "../check.js";
import { createApiClient } from "../api.js";
import { displayTestingBanner } from "../banner.js";
import { formatScanTable, formatScanJSON, getExitCode } from "../formatter.js";

export async function handleCheckCommand({
  scanId,
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
    consola.info(`Checking scan: ${scanId}`);
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
          2,
        ),
      );
    } else {
      consola.error("Error creating API client:", apiClient.error);
    }
    process.exit(1);
  }

  if (!json) {
    consola.debug(`Getting scan: ${scanId}`);
  }
  const checkedScanResult = await checkScan(apiClient, scanId);
  if (isError(checkedScanResult)) {
    if (json) {
      console.error(
        JSON.stringify(
          { error: "Failed to check scan", details: checkedScanResult },
          null,
          2,
        ),
      );
    } else {
      consola.error(
        "Error checking scan:",
        JSON.stringify(checkedScanResult, null, 2),
      );
    }
    process.exit(1);
  }

  // Normalize the response - check returns { result: {...} } or direct object
  const scanData = checkedScanResult.result || checkedScanResult;

  // Format output
  if (json) {
    console.log(formatScanJSON(scanData));
  } else {
    formatScanTable(scanData);
  }

  // Determine exit code
  const exitCode = getExitCode(scanData, {
    failOnHigh: failOnHigh !== undefined ? failOnHigh : true,
    failOnMedium: failOnMedium || false,
    failOnLow: failOnLow || false,
  });

  if (exitCode !== 0 && !json) {
    consola.warn(
      `Scan completed with risk level that triggers failure (exit code: ${exitCode})`,
    );
  }

  process.exit(exitCode);
}
