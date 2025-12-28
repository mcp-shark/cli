import { readFileSync } from "node:fs";
import axios from "axios";
import { consola } from "consola";
import { createApiClient } from "../api.js";
import { displayTestingBanner } from "../banner.js";
import { formatScanJSON, formatScanTable, getExitCode } from "../formatter.js";

/**
 * Create API client with error handling
 */
function createApiClientWithErrorHandling(tokenValue, json) {
  try {
    return createApiClient(tokenValue);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    if (json) {
      console.error(
        JSON.stringify(
          {
            error: "Failed to create API client",
            details: errorMessage,
          },
          null,
          2
        )
      );
    } else {
      consola.error("Error creating API client:", errorMessage);
    }
    process.exit(1);
  }
}

/**
 * Read agent data from file or URL
 */
async function readAgentData(input, json) {
  // Check if input is a URL
  const isUrl = input.startsWith("http://") || input.startsWith("https://");

  if (isUrl) {
    // Download from URL
    if (!json) {
      consola.info(`Downloading agent card from URL: ${input}`);
    }
    const response = await axios.get(input, {
      headers: {
        Accept: "application/json",
      },
      timeout: 30000, // 30 second timeout
    });
    if (!json) {
      consola.success("Successfully downloaded agent card");
    }
    return response.data;
  }
  // Read from local file
  if (!json) {
    consola.debug(`Reading agent card from file: ${input}`);
  }
  const fileContent = readFileSync(input, "utf-8");
  return JSON.parse(fileContent);
}

/**
 * Read and validate agent data with error handling
 */
async function readAndValidateAgentData(input, json) {
  try {
    const data = await readAgentData(input, json);

    // Validate that we got valid JSON data
    if (!data || typeof data !== "object") {
      throw new Error("Invalid agent card data: must be a JSON object");
    }
    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isUrl = input.startsWith("http://") || input.startsWith("https://");
    const errorType = isUrl
      ? "Failed to download or parse agent card from URL"
      : "Failed to read or parse input file";

    if (json) {
      console.error(
        JSON.stringify(
          {
            error: errorType,
            message: errorMessage,
            input: isUrl ? input : undefined,
          },
          null,
          2
        )
      );
    } else {
      consola.error(`${errorType}: ${errorMessage}`);
      if (isUrl && error instanceof Error && error.message.includes("timeout")) {
        consola.warn("The download timed out. The URL may be slow or unreachable.");
      }
    }
    process.exit(1);
  }
}

/**
 * Transform smart agent API response to match formatter's expected structure
 */
function transformSmartAgentResponse(result) {
  const scanId = result.scan_id || null;
  const data = result.data || {};
  const overallRiskLevel = data.overall_risk_level || null;

  return {
    id: scanId,
    scan_id: scanId,
    created_at: result.created_at || null,
    overall_risk_level: overallRiskLevel,
    data: data,
    analysis_result: data,
    owasp_summary: result.owasp_summary || null,
    rate_limit: result.rate_limit || null,
    is_error: result.error || !result.success || false,
    error_message: result.error || result.message || null,
    error_type: result.error_type || null,
    http_status_code: result.http_status_code || null,
    // Preserve smart_agent data for potential future use
    smart_agent: result.smart_agent || result.smartAgent || result.agentradar || null,
  };
}

/**
 * Handle Smart Agent scan command
 * Scans agents/registries and submits to API
 */
export async function handleSmartAgentScanCommand({
  input,
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
    consola.info(`Running Smart Agent scan with input: ${input}`);
    consola.debug(`Token: ${tokenValue.substring(0, 8)}...`);
    if (verbose) {
      consola.debug("Verbose mode enabled");
    }
  }

  const apiClient = createApiClientWithErrorHandling(tokenValue, json);

  // Read and parse input (file path or URL)
  const agentData = await readAndValidateAgentData(input, json);

  // Submit to Smart Agent API endpoint
  if (!json) {
    consola.info("Submitting to Smart Agent API...");
  }

  try {
    const response = await apiClient.post("/api/smart-agent/scan", agentData);
    const result = response.data;

    if (result.error || !result.success) {
      // Transform error result for consistent formatting
      const errorResult = transformSmartAgentResponse(result);
      if (json) {
        console.error(formatScanJSON(errorResult));
      } else {
        consola.error("Smart Agent scan failed:", result.error || result.message);
        formatScanTable(errorResult);
      }
      process.exit(1);
    }

    // Transform response to match formatter's expected structure
    const normalizedResult = transformSmartAgentResponse(result);

    // Format output using the same formatters as normal scan
    if (json) {
      console.log(formatScanJSON(normalizedResult));
    } else {
      formatScanTable(normalizedResult);
    }

    // Determine exit code using the same logic as normal scan
    const exitCode = getExitCode(normalizedResult, {
      failOnHigh: failOnHigh !== undefined ? failOnHigh : true,
      failOnMedium: failOnMedium || false,
      failOnLow: failOnLow || false,
    });

    if (exitCode !== 0 && !json) {
      consola.warn(`Scan completed with risk level that triggers failure (exit code: ${exitCode})`);
    }

    process.exit(exitCode);
  } catch (error) {
    // Handle axios errors
    if (error.response) {
      const errorData = error.response.data || {};
      if (json) {
        console.error(JSON.stringify(errorData, null, 2));
      } else {
        consola.error(
          "Smart Agent scan failed:",
          errorData.error || errorData.message || error.message
        );
      }
    } else {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (json) {
        console.error(
          JSON.stringify({ error: "Smart Agent scan failed", message: errorMessage }, null, 2)
        );
      } else {
        consola.error("Smart Agent scan failed:", errorMessage);
      }
    }
    process.exit(1);
  }
}
