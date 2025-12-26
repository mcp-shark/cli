import { readFileSync } from "node:fs";
import axios from "axios";
import { consola } from "consola";
import { createApiClient } from "../api.js";
import { displayTestingBanner } from "../banner.js";

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
 * Calculate exit code based on risk level and Smart Agent findings
 */
function calculateExitCode(riskLevel, result, failOnHigh, failOnMedium, failOnLow) {
  if (riskLevel) {
    if (
      (failOnHigh !== undefined ? failOnHigh : true) &&
      (riskLevel === "high" || riskLevel === "critical")
    ) {
      return 1;
    }
    if (failOnMedium && riskLevel === "medium") {
      return 1;
    }
    if (failOnLow && riskLevel === "low") {
      return 1;
    }
  }

  // Also fail if Smart Agent found critical issues
  if (result.smart_agent?.enabled || result.smartAgent?.enabled) {
    const smartAgentData = result.smart_agent || result.smartAgent || {};
    const summary = smartAgentData.summary || {};
    if (summary.totalVulnerabilities > 0 || summary.totalPaths > 0) {
      // Check if any vulnerabilities are critical
      const vulnerabilities = smartAgentData.vulnerabilities || [];
      const hasCriticalVulns = vulnerabilities.some((v) => v.severity === "critical");
      if (hasCriticalVulns) {
        return 1;
      }
    }
  }
  return 0;
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
      if (json) {
        console.error(JSON.stringify(result, null, 2));
      } else {
        consola.error("Smart Agent scan failed:", result.error || result.message);
      }
      process.exit(1);
    }

    // Format output
    if (json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      consola.success("Smart Agent scan completed successfully");
      consola.info(`Scan ID: ${result.scan_id}`);

      const smartAgentData = result.smart_agent || result.smartAgent || result.agentradar || {};
      if (smartAgentData.enabled || result.smart_agent_enabled) {
        const summary = smartAgentData.summary || {};
        consola.info("Smart Agent Analysis Summary:");
        consola.info(`  Agents: ${summary.totalAgents || 0}`);
        consola.info(`  Tools: ${summary.totalTools || 0}`);
        consola.info(`  Vulnerabilities: ${summary.totalVulnerabilities || 0}`);
        consola.info(`  Attack Paths: ${summary.totalPaths || 0}`);

        if (summary.totalVulnerabilities > 0) {
          consola.warn(`Found ${summary.totalVulnerabilities} vulnerability/vulnerabilities`);
        }
        if (summary.totalPaths > 0) {
          consola.warn(`Found ${summary.totalPaths} attack path(s)`);
        }
      }

      if (result.data?.overall_risk_level) {
        const riskLevel = result.data.overall_risk_level;
        consola.info(`Overall Risk Level: ${riskLevel.toUpperCase()}`);
      }

      if (result.scan_id) {
        consola.info("\nView detailed results: https://smart.mcpshark.sh/dashboard/smart-agent");
      }
    }

    // Determine exit code based on risk level and options
    const riskLevel = result.data?.overall_risk_level;
    const exitCode = calculateExitCode(riskLevel, result, failOnHigh, failOnMedium, failOnLow);

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
