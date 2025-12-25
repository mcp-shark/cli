import { consola } from "consola";
import { isError } from "../error.js";
import { formatSimpleFallback } from "./table-fallback.js";
import { formatSingleScanTable } from "./table-render.js";
import { buildRows } from "./table-rows.js";
import { formatErrorBox, generateDeepLink } from "./utils.js";

/**
 * Format scan result(s) as a table
 */
export function formatScanTable(scanResult) {
  try {
    if (Array.isArray(scanResult)) {
      for (const [index, result] of scanResult.entries()) {
        const serverName = result.server_name || result.server?.name || null;
        if (index > 0) {
          consola.log("");
        }
        if (serverName) {
          consola.log(`\nScan Result for Server: ${serverName}`);
        }
        formatSingleScanTable(result, serverName, buildRows);
        const scanId = result.id || result.scan_id;
        if (scanId) {
          const deepLink = generateDeepLink(scanId);
          if (deepLink) {
            consola.log(`\nView this scan online: ${deepLink}`);
          }
        }
        if (result.is_error || isError(result)) {
          const errorMsg =
            result.error_message || result.error?.message || result.message || "Unknown error";
          const errorBox = formatErrorBox(
            `Scan failed for server "${serverName || "unknown"}"`,
            errorMsg
          );
          consola.error(`\n${errorBox}`);
        }
      }
    } else {
      formatSingleScanTable(scanResult, null, buildRows);
    }
  } catch (error) {
    consola.error("Error formatting scan table:", error.message);
    if (Array.isArray(scanResult)) {
      for (const result of scanResult) {
        formatSimpleFallback(result);
      }
    } else {
      formatSimpleFallback(scanResult);
    }
  }
}
