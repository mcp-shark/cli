import { consola } from "consola";
import cliBoxes from "cli-boxes";
import { isError } from "../error.js";
import { generateDeepLink, wrapText, formatErrorBox } from "./utils.js";

/**
 * Fallback simple formatter when table formatting fails
 */
function formatSimpleFallback(scanResult, serverName = null) {
  try {
    consola.warn("Table formatting failed, displaying simplified output:");
    console.log("");
    if (serverName) console.log(`Server: ${serverName}`);
    console.log(`Scan ID: ${scanResult.id || scanResult.scan_id || "N/A"}`);
    console.log(
      `Created At: ${
        scanResult.created_at
          ? new Date(scanResult.created_at).toISOString()
          : "N/A"
      }`,
    );
    const isErrorResult =
      isError(scanResult) ||
      scanResult.is_error ||
      scanResult.success === false ||
      (scanResult.status !== undefined && scanResult.status !== 200);
    console.log(`Status: ${isErrorResult ? "ERROR" : "SUCCESS"}`);
    const riskLevel =
      scanResult.overall_risk_level ||
      scanResult.data?.overall_risk_level ||
      "N/A";
    console.log(`Risk Level: ${riskLevel.toUpperCase()}`);
    if (isErrorResult || scanResult.error_message) {
      const errorMessage =
        scanResult.error_message ||
        scanResult.error?.message ||
        (isError(scanResult) ? scanResult.message : null) ||
        "N/A";
      console.log(`Error Message: ${errorMessage}`);
    }
    const scanId = scanResult.id || scanResult.scan_id;
    if (scanId) {
      const deepLink = generateDeepLink(scanId);
      if (deepLink) console.log(`View Online: ${deepLink}`);
    }
    console.log("");
  } catch (_fallbackError) {
    consola.error("Both table and fallback formatting failed. Raw data:");
    console.log(JSON.stringify(scanResult, null, 2));
  }
}

/**
 * Build rows array from scan result
 */
function buildRows(scanResult, serverName) {
  const rows = [];
  if (serverName) rows.push(["Server", serverName]);
  rows.push(["Scan ID", scanResult.id || scanResult.scan_id || "N/A"]);
  rows.push([
    "Created At",
    scanResult.created_at
      ? new Date(scanResult.created_at).toISOString()
      : "N/A",
  ]);
  const isErrorResult =
    isError(scanResult) ||
    scanResult.is_error ||
    scanResult.success === false ||
    (scanResult.status !== undefined && scanResult.status !== 200);
  rows.push(["Status", isErrorResult ? "ERROR" : "SUCCESS"]);
  const riskLevel =
    scanResult.overall_risk_level ||
    scanResult.data?.overall_risk_level ||
    "N/A";
  rows.push(["Risk Level", riskLevel.toUpperCase()]);

  if (isErrorResult || scanResult.error_message) {
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
    const validationDetails =
      scanResult.error?.details || scanResult.validation_details || null;
    if (validationDetails) {
      let detailsStr;
      if (Array.isArray(validationDetails)) {
        detailsStr = validationDetails
          .map((d) => {
            if (typeof d === "string") return d;
            if (d.field && d.message) return `${d.field}: ${d.message}`;
            return JSON.stringify(d);
          })
          .join("\n");
      } else if (typeof validationDetails === "object") {
        detailsStr = JSON.stringify(validationDetails, null, 2);
      } else {
        detailsStr = String(validationDetails);
      }
      rows.push(["Validation Details", detailsStr, true]);
    }
  }

  if (scanResult.rate_limit) {
    rows.push([
      "Rate Limit",
      `${scanResult.rate_limit.remaining || 0}/${scanResult.rate_limit.limit || 0}`,
    ]);
  }

  const scanId = scanResult.id || scanResult.scan_id;
  if (scanId) {
    const deepLink = generateDeepLink(scanId);
    if (deepLink) rows.push(["View Online", deepLink]);
  }

  const analysis = scanResult.analysis_result || scanResult.data;
  if (analysis && !isErrorResult) {
    if (analysis.overall_reason) {
      rows.push(["Overall Reason", analysis.overall_reason, true]);
    }
    const findings = [
      ["Tool Findings", analysis.tool_findings],
      ["Resource Findings", analysis.resource_findings],
      ["Prompt Findings", analysis.prompt_findings],
    ];
    findings.forEach(([label, data]) => {
      if (data) {
        rows.push([label, Array.isArray(data) ? data.length.toString() : "0"]);
      }
    });
  }
  return { rows, isErrorResult };
}

/**
 * Render a table row with wrapping support
 */
function renderRow(box, label, valueStr, col1Width, col2Width, maxCol2Width) {
  const lines = [];
  const hasNewlines = valueStr.includes("\n");
  const needsWrapping = valueStr.length > maxCol2Width;
  let allWrappedLines = [];

  if (hasNewlines || needsWrapping) {
    const linesByNewline = valueStr.split("\n");
    for (const line of linesByNewline) {
      if (line.trim()) {
        if (needsWrapping || line.length > maxCol2Width) {
          allWrappedLines.push(...wrapText(line, maxCol2Width));
        } else {
          allWrappedLines.push(line);
        }
      }
    }
  } else if (valueStr.length > maxCol2Width) {
    allWrappedLines = wrapText(valueStr, maxCol2Width);
  } else {
    allWrappedLines = [valueStr];
  }

  const firstLinePadding = " ".repeat(Math.max(0, col1Width - label.length));
  for (let i = 0; i < allWrappedLines.length; i++) {
    const line = allWrappedLines[i];
    const padding2 = " ".repeat(Math.max(0, col2Width - line.length));
    lines.push(
      i === 0
        ? `${box.left} ${label}${firstLinePadding} │ ${line}${padding2} ${box.right}`
        : `${box.left} ${" ".repeat(col1Width)} │ ${line}${padding2} ${box.right}`,
    );
  }
  return lines;
}

/**
 * Format a single scan result as a table
 */
function formatSingleScanTable(scanResult, serverName = null) {
  try {
    const { rows } = buildRows(scanResult, serverName);
    if (rows.length === 0) {
      consola.warn("No data to display in table");
      formatSimpleFallback(scanResult, serverName);
      return;
    }

    const col1Width = Math.max(...rows.map((row) => row[0].length), 1);
    const terminalWidth = process.stdout.columns || 80;
    const maxCol2Width = Math.max(
      1,
      Math.min(
        Math.max(...rows.map((row) => String(row[1]).length), 1),
        terminalWidth - col1Width - 10,
      ),
    );
    const col2Width = Math.max(
      1,
      ...rows.map((row) => {
        const value = String(row[1]);
        if (row[2] === true && value.length > maxCol2Width) {
          return maxCol2Width;
        }
        return Math.min(value.length, maxCol2Width);
      }),
    );

    const box = cliBoxes.single;
    const tableLines = [];
    tableLines.push(
      `${box.topLeft}${box.top.repeat(Math.max(0, col1Width + 2))}┬${box.top.repeat(Math.max(0, col2Width + 2))}${box.topRight}`,
    );

    for (const row of rows) {
      const [label, value, shouldWrap] = row;
      const valueStr = String(value);
      const needsWrapping = shouldWrap && valueStr.length > maxCol2Width;
      tableLines.push(
        ...renderRow(
          box,
          label,
          valueStr,
          col1Width,
          col2Width,
          needsWrapping ? maxCol2Width : col2Width,
        ),
      );
    }

    tableLines.push(
      `${box.bottomLeft}${box.bottom.repeat(Math.max(0, col1Width + 2))}┴${box.bottom.repeat(Math.max(0, col2Width + 2))}${box.bottomRight}`,
    );
    console.log(tableLines.join("\n"));
  } catch (error) {
    consola.debug("Table formatting error:", error.message);
    formatSimpleFallback(scanResult, serverName);
  }
}

/**
 * Format scan result(s) as a table
 */
export function formatScanTable(scanResult) {
  try {
    if (Array.isArray(scanResult)) {
      for (let i = 0; i < scanResult.length; i++) {
        const result = scanResult[i];
        const serverName = result.server_name || result.server?.name || null;
        if (i > 0) consola.log("");
        if (serverName) {
          consola.log(`\nScan Result for Server: ${serverName}`);
        }
        formatSingleScanTable(result, serverName);
        const scanId = result.id || result.scan_id;
        if (scanId) {
          const deepLink = generateDeepLink(scanId);
          if (deepLink) consola.log(`\nView this scan online: ${deepLink}`);
        }
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
      formatSingleScanTable(scanResult);
    }
  } catch (error) {
    consola.error("Error formatting scan table:", error.message);
    if (Array.isArray(scanResult)) {
      scanResult.forEach((result) => formatSimpleFallback(result));
    } else {
      formatSimpleFallback(scanResult);
    }
  }
}
