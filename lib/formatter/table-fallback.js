import { consola } from "consola";
import { isError } from "../error.js";
import { generateDeepLink } from "./utils.js";

/**
 * Fallback simple formatter when table formatting fails
 */
export function formatSimpleFallback(scanResult, serverName = null) {
  try {
    consola.warn("Table formatting failed, displaying simplified output:");
    console.log("");
    if (serverName) {
      console.log(`Server: ${serverName}`);
    }
    console.log(`Scan ID: ${scanResult.id || scanResult.scan_id || "N/A"}`);
    console.log(
      `Created At: ${scanResult.created_at ? new Date(scanResult.created_at).toISOString() : "N/A"}`
    );
    const isErrorResult =
      isError(scanResult) ||
      scanResult.is_error ||
      scanResult.success === false ||
      (scanResult.status !== undefined && scanResult.status !== 200);
    console.log(`Status: ${isErrorResult ? "ERROR" : "SUCCESS"}`);
    const riskLevel = scanResult.overall_risk_level || scanResult.data?.overall_risk_level || "N/A";
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
      if (deepLink) {
        console.log(`View Online: ${deepLink}`);
      }
    }

    // Display OWASP summary if available
    const owaspSummary = scanResult.owasp_summary || scanResult.data?.owasp_summary;
    if (owaspSummary && !isErrorResult) {
      const total = owaspSummary.total || 0;
      console.log(`OWASP Findings: ${total}`);

      const categories = owaspSummary.categories || [];
      if (categories.length > 0) {
        console.log("OWASP Categories:");
        for (const cat of categories) {
          console.log(`  ${cat.code} (${cat.name}) - ${cat.count}`);
        }
      }
    }

    console.log("");
  } catch (_fallbackError) {
    consola.error("Both table and fallback formatting failed. Raw data:");
    console.log(JSON.stringify(scanResult, null, 2));
  }
}
