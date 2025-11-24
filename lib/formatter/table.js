import { consola } from "consola";
import cliBoxes from "cli-boxes";
import { isError } from "../error.js";
import { generateDeepLink, wrapText, formatErrorBox } from "./utils.js";

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
  // A successful response has success: true or data property with analysis
  const isErrorResult =
    isError(scanResult) ||
    scanResult.is_error ||
    scanResult.success === false ||
    (scanResult.status !== undefined && scanResult.status !== 200);
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

    // Show validation error details if available
    const validationDetails =
      scanResult.error?.details || scanResult.validation_details || null;
    if (validationDetails) {
      const detailsStr = (() => {
        if (Array.isArray(validationDetails)) {
          return validationDetails
            .map((d) => {
              if (typeof d === "string") return d;
              if (d.field && d.message) return `${d.field}: ${d.message}`;
              return JSON.stringify(d);
            })
            .join("\n");
        }
        if (typeof validationDetails === "object") {
          return JSON.stringify(validationDetails, null, 2);
        }
        return String(validationDetails);
      })();
      rows.push(["Validation Details", detailsStr, true]); // true indicates should wrap
    }
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

    // Check if text contains newlines or needs wrapping
    const hasNewlines = valueStr.includes("\n");
    const needsWrapping = shouldWrap && valueStr.length > maxCol2Width;

    if (hasNewlines || needsWrapping) {
      // First split by newlines, then wrap each line if needed
      const linesByNewline = valueStr.split("\n");
      const allWrappedLines = [];
      for (const line of linesByNewline) {
        if (line.trim()) {
          if (needsWrapping || line.length > maxCol2Width) {
            const wrapped = wrapText(line, maxCol2Width);
            allWrappedLines.push(...wrapped);
          } else {
            allWrappedLines.push(line);
          }
        }
      }

      // Calculate padding for first line's label section
      const firstLinePadding = " ".repeat(col1Width - label.length);
      for (let i = 0; i < allWrappedLines.length; i++) {
        const line = allWrappedLines[i];
        const padding2 = " ".repeat(col2Width - line.length);
        const rowContent =
          i === 0
            ? `${box.left} ${label}${firstLinePadding} │ ${line}${padding2} ${box.right}`
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
