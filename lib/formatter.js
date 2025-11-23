import { consola } from "consola";
import cliBoxes from "cli-boxes";
import { isError } from "./error.js";
import { getApiBaseUrl } from "./api.js";

/**
 * Format an error message in a box
 */
function formatErrorBox(title, message) {
  const box = cliBoxes.round;
  const lines = [title, "", message].filter(Boolean);
  const width = Math.max(...lines.map((line) => line.length)) + 4;

  const boxParts = [
    `${box.topLeft}${box.top.repeat(width - 2)}${box.topRight}`,
    `${box.left}${" ".repeat(width - 2)}${box.right}`,
    ...lines.map((line) => {
      const padding = width - line.length - 2;
      const leftPad = Math.floor(padding / 2);
      const rightPad = padding - leftPad;
      return `${box.left}${" ".repeat(leftPad)}${line}${" ".repeat(rightPad)}${box.right}`;
    }),
    `${box.left}${" ".repeat(width - 2)}${box.right}`,
    `${box.bottomLeft}${box.bottom.repeat(width - 2)}${box.bottomRight}`,
  ];

  return boxParts.join("\n");
}

/**
 * Generate a deep link URL for a scan result
 */
function generateDeepLink(scanId, baseUrl = getApiBaseUrl()) {
  if (!scanId || scanId === "N/A") {
    return null;
  }
  return `${baseUrl}/scan-results?id=${encodeURIComponent(scanId)}`;
}

/**
 * Wrap text to fit within a maximum width
 */
function wrapText(text, maxWidth) {
  const words = String(text).split(" ");
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      // If a single word is longer than maxWidth, break it
      if (word.length > maxWidth) {
        for (let i = 0; i < word.length; i += maxWidth) {
          lines.push(word.slice(i, i + maxWidth));
        }
        currentLine = "";
      } else {
        currentLine = word;
      }
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines.length > 0 ? lines : [""];
}

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
  // Check if this is an error (either isError() or is_error property)
  const isErrorResult = isError(scanResult) || scanResult.is_error;
  rows.push(["Status", isErrorResult ? "ERROR" : "SUCCESS"]);

  // Risk level
  const riskLevel =
    scanResult.overall_risk_level ||
    scanResult.data?.overall_risk_level ||
    "N/A";
  rows.push(["Risk Level", riskLevel.toUpperCase()]);

  // Error information if present
  if (isErrorResult || scanResult.error_message) {
    // Extract error message from ApiError or regular error response
    const errorMessage =
      scanResult.error_message ||
      scanResult.error?.message ||
      (isError(scanResult) ? scanResult.message : null) ||
      "N/A";
    const errorType =
      scanResult.error_type ||
      scanResult.error?.type ||
      (isError(scanResult) ? scanResult.name : null) ||
      "N/A";
    const httpStatus =
      scanResult.http_status_code ||
      scanResult.error?.statusCode ||
      (isError(scanResult) && scanResult.status ? scanResult.status : null) ||
      "N/A";

    rows.push(["Error Type", errorType]);
    rows.push(["Error Message", errorMessage]);
    rows.push(["HTTP Status", httpStatus]);
  }

  // Rate limit information if present
  if (scanResult.rate_limit) {
    rows.push([
      "Rate Limit",
      `${scanResult.rate_limit.remaining || 0}/${scanResult.rate_limit.limit || 0}`,
    ]);
  }

  // Deep link to view result in web app
  const scanId = scanResult.id || scanResult.scan_id;
  if (scanId) {
    const deepLink = generateDeepLink(scanId);
    if (deepLink) {
      rows.push(["View Online", deepLink]);
    }
  }

  // Analysis summary if present (only show if not an error)
  const analysis = scanResult.analysis_result || scanResult.data;
  if (analysis && !isErrorResult) {
    if (analysis.overall_reason) {
      // Store as array to indicate it should be wrapped
      rows.push(["Overall Reason", analysis.overall_reason, true]);
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
  // Set a maximum width for the second column to prevent extremely wide tables
  // Use terminal width if available, otherwise default to 80 characters
  const terminalWidth = process.stdout.columns || 80;
  const maxCol2Width = Math.min(
    Math.max(...rows.map((row) => String(row[1]).length)),
    terminalWidth - col1Width - 10, // Leave space for borders and padding
  );
  const col2Width = Math.max(
    ...rows.map((row) => {
      const value = String(row[1]);
      // For wrapped text, use the max width
      if (row[2] === true && value.length > maxCol2Width) {
        return maxCol2Width;
      }
      return Math.min(value.length, maxCol2Width);
    }),
  );

  // Use cli-boxes for proper table formatting
  const box = cliBoxes.single;
  const tableLines = [];

  // Top border with column separator
  const topBorder = `${
    box.topLeft + box.top.repeat(col1Width + 2)
  }┬${box.top.repeat(col2Width + 2)}${box.topRight}`;
  tableLines.push(topBorder);

  // Table rows with column separator
  for (const row of rows) {
    const [label, value, shouldWrap] = row;
    const valueStr = String(value);

    if (shouldWrap && valueStr.length > maxCol2Width) {
      // Wrap the text into multiple lines
      const wrappedLines = wrapText(valueStr, maxCol2Width);
      for (let i = 0; i < wrappedLines.length; i++) {
        const line = wrappedLines[i];
        const padding1 = " ".repeat(col1Width - (i === 0 ? label.length : 0));
        const padding2 = " ".repeat(col2Width - line.length);
        const rowContent =
          i === 0
            ? `${box.left} ${label}${padding1} │ ${line}${padding2} ${box.right}`
            : `${box.left} ${" ".repeat(col1Width)} │ ${line}${padding2} ${box.right}`;
        tableLines.push(rowContent);
      }
    } else {
      // Single line
      const padding1 = " ".repeat(col1Width - label.length);
      const padding2 = " ".repeat(col2Width - valueStr.length);
      const rowContent = `${box.left} ${label}${padding1} │ ${valueStr}${padding2} ${box.right}`;
      tableLines.push(rowContent);
    }
  }

  // Bottom border with column separator
  const bottomBorder = `${
    box.bottomLeft + box.bottom.repeat(col1Width + 2)
  }┴${box.bottom.repeat(col2Width + 2)}${box.bottomRight}`;
  tableLines.push(bottomBorder);

  // Use console.log instead of consola.log to avoid timestamps
  console.log(tableLines.join("\n"));
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

      // Display deep link prominently after the table
      const scanId = result.id || result.scan_id;
      if (scanId) {
        const deepLink = generateDeepLink(scanId);
        if (deepLink) {
          consola.log(`\nView this scan online: ${deepLink}`);
        }
      }

      // Show error prominently if this scan failed
      if (result.is_error || isError(result)) {
        const errorMsg =
          result.error_message ||
          result.error?.message ||
          result.message ||
          "Unknown error";
        const errorBox = formatErrorBox(
          `Scan failed for server "${serverName || "unknown"}"`,
          errorMsg,
        );
        consola.error(`\n${errorBox}`);
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
      const scanId = result.id || result.scan_id || null;
      const deepLink = scanId ? generateDeepLink(scanId) : null;
      return {
        server_name: result.server_name || result.server?.name || null,
        id: scanId,
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
        deep_link: deepLink,
      };
    });
    return JSON.stringify(normalized, null, 2);
  }

  // Single result
  const scanId = scanResult.id || scanResult.scan_id || null;
  const deepLink = scanId ? generateDeepLink(scanId) : null;
  const normalized = {
    id: scanId,
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
    deep_link: deepLink,
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
