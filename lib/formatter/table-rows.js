import { isError } from "../error.js";
import { generateDeepLink } from "./utils.js";

/**
 * Build rows array from scan result
 */
export function buildRows(scanResult, serverName) {
  const rows = [];
  if (serverName) {
    rows.push(["Server", serverName]);
  }
  rows.push(["Scan ID", scanResult.id || scanResult.scan_id || "N/A"]);
  rows.push([
    "Created At",
    scanResult.created_at ? new Date(scanResult.created_at).toISOString() : "N/A",
  ]);
  const isErrorResult =
    isError(scanResult) ||
    scanResult.is_error ||
    scanResult.success === false ||
    (scanResult.status !== undefined && scanResult.status !== 200);
  rows.push(["Status", isErrorResult ? "ERROR" : "SUCCESS"]);
  const riskLevel = scanResult.overall_risk_level || scanResult.data?.overall_risk_level || "N/A";
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
    const validationDetails = scanResult.error?.details || scanResult.validation_details || null;
    if (validationDetails) {
      const detailsStr = Array.isArray(validationDetails)
        ? validationDetails
            .map((d) => {
              if (typeof d === "string") {
                return d;
              }
              if (d.field && d.message) {
                return `${d.field}: ${d.message}`;
              }
              return JSON.stringify(d);
            })
            .join("\n")
        : typeof validationDetails === "object"
          ? JSON.stringify(validationDetails, null, 2)
          : String(validationDetails);
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
    if (deepLink) {
      rows.push(["View Online", deepLink]);
    }
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
    for (const [label, data] of findings) {
      if (data) {
        rows.push([label, Array.isArray(data) ? data.length.toString() : "0"]);
      }
    }
  }

  // Extract and display OWASP summary
  const owaspSummary = scanResult.owasp_summary || scanResult.data?.owasp_summary;
  if (owaspSummary && !isErrorResult) {
    const total = owaspSummary.total || 0;
    rows.push(["OWASP Findings", total.toString()]);

    const categories = owaspSummary.categories || [];
    if (categories.length > 0) {
      const categoryStr = categories
        .map((cat) => `${cat.code} (${cat.name}) - ${cat.count}`)
        .join("\n");
      rows.push(["OWASP Categories", categoryStr, true]);
    }
  }

  return { rows, isErrorResult };
}
