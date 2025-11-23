import { consola } from "consola";

/**
 * Format scan result as a table
 */
export function formatScanTable(scanResult) {
  const rows = [];

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
 * Format scan result as JSON (for piping to jq)
 */
export function formatScanJSON(scanResult) {
  // Normalize the response structure
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
 * Determine exit code based on scan result
 * Returns 0 for success/low risk, non-zero for errors/high risk
 */
export function getExitCode(scanResult, options = {}) {
  const {
    failOnHigh = true,
    failOnMedium = false,
    failOnLow = false,
  } = options;

  // Exit with error if scan itself failed
  if (scanResult.is_error) {
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
