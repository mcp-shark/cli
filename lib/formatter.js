import { consola } from "consola";
import { isError } from "./error.js";

/**
 * Format a single scan result as a table
 */
function formatSingleScanTable(scanResult, serverName = null) {
  const rows = [];

  // Server name if provided
  if (serverName) {
    rows.push(["Server", serverName]);
  }

  // Basic scan information
  rows.push(["Scan ID", scanResult.id || scanResult.scan_id || "N/A"]);
  rows.push([
    "Created At",
    scanResult.created_at
      ? new Date(scanResult.created_at).toISOString()
      : "N/A",
  ]);
  rows.push(["Status", scanResult.is_error ? "ERROR" : "SUCCESS"]);

  // Risk level
  const riskLevel =
    scanResult.overall_risk_level ||
    scanResult.data?.overall_risk_level ||
    "N/A";
  rows.push(["Risk Level", riskLevel.toUpperCase()]);

  // Error information if present
  if (scanResult.is_error || scanResult.error_message) {
    rows.push([
      "Error Type",
      scanResult.error_type || scanResult.error?.type || "N/A",
    ]);
    rows.push([
      "Error Message",
      scanResult.error_message || scanResult.error?.message || "N/A",
    ]);
    rows.push([
      "HTTP Status",
      scanResult.http_status_code || scanResult.error?.statusCode || "N/A",
    ]);
  }

  // Rate limit information if present
  if (scanResult.rate_limit) {
    rows.push([
      "Rate Limit",
      `${scanResult.rate_limit.remaining || 0}/${scanResult.rate_limit.limit || 0}`,
    ]);
  }

  // Analysis summary if present
  const analysis = scanResult.analysis_result || scanResult.data;
  if (analysis && !scanResult.is_error) {
    if (analysis.overall_reason) {
      rows.push(["Overall Reason", analysis.overall_reason]);
    }
    if (analysis.tool_findings) {
      rows.push([
        "Tool Findings",
        Array.isArray(analysis.tool_findings)
          ? analysis.tool_findings.length.toString()
          : "0",
      ]);
    }
    if (analysis.resource_findings) {
      rows.push([
        "Resource Findings",
        Array.isArray(analysis.resource_findings)
          ? analysis.resource_findings.length.toString()
          : "0",
      ]);
    }
    if (analysis.prompt_findings) {
      rows.push([
        "Prompt Findings",
        Array.isArray(analysis.prompt_findings)
          ? analysis.prompt_findings.length.toString()
          : "0",
      ]);
    }
  }

  // Calculate column widths
  const col1Width = Math.max(...rows.map((row) => row[0].length));
  const col2Width = Math.max(...rows.map((row) => String(row[1]).length));

  // Print table
  const border = "─".repeat(col1Width + col2Width + 5);
  consola.log(border);
  for (const [label, value] of rows) {
    const padding1 = " ".repeat(col1Width - label.length);
    const padding2 = " ".repeat(col2Width - String(value).length);
    consola.log(`│ ${label}${padding1} │ ${value}${padding2} │`);
  }
  consola.log(border);
}

/**
 * Format scan result(s) as a table
 * Handles both single result and array of results
 */
export function formatScanTable(scanResult) {
  // If it's an array, format each one
  if (Array.isArray(scanResult)) {
    for (let i = 0; i < scanResult.length; i++) {
      const result = scanResult[i];
      const serverName = result.server_name || result.server?.name || null;

      if (i > 0) {
        consola.log(""); // Add spacing between multiple results
      }

      if (serverName) {
        consola.log(`\nScan Result for Server: ${serverName}`);
      }

      formatSingleScanTable(result, serverName);

      // Show error prominently if this scan failed
      if (result.is_error || isError(result)) {
        consola.error(`\nScan failed for server "${serverName || "unknown"}":`);
        const errorMsg =
          result.error_message ||
          result.error?.message ||
          result.message ||
          "Unknown error";
        consola.error(`   ${errorMsg}`);
      }
    }
  } else {
    // Single result
    formatSingleScanTable(scanResult);
  }
}

/**
 * Format scan result as JSON (for piping to jq)
 * Handles both single result and array of results
 */
export function formatScanJSON(scanResult) {
  // If it's an array, normalize each result
  if (Array.isArray(scanResult)) {
    const normalized = scanResult.map((result) => {
      const isErrorResult = isError(result) || result.is_error;
      return {
        server_name: result.server_name || result.server?.name || null,
        id: result.id || result.scan_id || null,
        created_at: result.created_at || null,
        status: isErrorResult ? "error" : "success",
        overall_risk_level:
          result.overall_risk_level || result.data?.overall_risk_level || null,
        is_error: isErrorResult,
        error_message:
          result.error_message ||
          result.error?.message ||
          result.message ||
          null,
        error_type: result.error_type || result.error?.type || null,
        http_status_code:
          result.http_status_code || result.error?.statusCode || null,
        rate_limit: result.rate_limit || null,
        analysis_result: result.analysis_result || result.data || null,
      };
    });
    return JSON.stringify(normalized, null, 2);
  }

  // Single result
  const normalized = {
    id: scanResult.id || scanResult.scan_id || null,
    created_at: scanResult.created_at || null,
    status: scanResult.is_error ? "error" : "success",
    overall_risk_level:
      scanResult.overall_risk_level ||
      scanResult.data?.overall_risk_level ||
      null,
    is_error: scanResult.is_error || false,
    error_message:
      scanResult.error_message || scanResult.error?.message || null,
    error_type: scanResult.error_type || scanResult.error?.type || null,
    http_status_code:
      scanResult.http_status_code || scanResult.error?.statusCode || null,
    rate_limit: scanResult.rate_limit || null,
    analysis_result: scanResult.analysis_result || scanResult.data || null,
  };

  return JSON.stringify(normalized, null, 2);
}

/**
 * Determine exit code for a single scan result
 */
function getExitCodeForSingle(scanResult, options = {}) {
  const {
    failOnHigh = true,
    failOnMedium = false,
    failOnLow = false,
  } = options;

  // Exit with error if scan itself failed
  if (isError(scanResult) || scanResult.is_error) {
    return 1;
  }

  // Check risk level
  const riskLevel =
    scanResult.overall_risk_level ||
    scanResult.data?.overall_risk_level ||
    null;

  if (!riskLevel) {
    return 0; // No risk level means success
  }

  const normalizedRisk = riskLevel.toLowerCase();

  switch (normalizedRisk) {
    case "critical":
    case "high":
      return failOnHigh ? 1 : 0;
    case "medium":
      return failOnMedium ? 1 : 0;
    case "low":
      return failOnLow ? 1 : 0;
    case "none":
    default:
      return 0;
  }
}

/**
 * Determine exit code based on scan result(s)
 * Returns 0 for success/low risk, non-zero for errors/high risk
 * For arrays, returns 1 if ANY scan failed or has high risk
 */
export function getExitCode(scanResult, options = {}) {
  const {
    failOnHigh = true,
    failOnMedium = false,
    failOnLow = false,
  } = options;

  // Handle array of results
  if (Array.isArray(scanResult)) {
    for (const result of scanResult) {
      const exitCode = getExitCodeForSingle(result, {
        failOnHigh,
        failOnMedium,
        failOnLow,
      });
      if (exitCode !== 0) {
        return 1; // Any failure means overall failure
      }
    }
    return 0; // All succeeded
  }

  return getExitCodeForSingle(scanResult, {
    failOnHigh,
    failOnMedium,
    failOnLow,
  });
}
