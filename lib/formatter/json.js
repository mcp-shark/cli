import { isError } from "../error.js";
import { generateDeepLink } from "./utils.js";

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
        overall_risk_level: result.overall_risk_level || result.data?.overall_risk_level || null,
        is_error: isErrorResult,
        error_message: result.error_message || result.error?.message || result.message || null,
        error_type: result.error_type || result.error?.type || null,
        http_status_code: result.http_status_code || result.error?.statusCode || null,
        rate_limit: result.rate_limit || null,
        analysis_result: result.analysis_result || result.data || null,
        owasp_summary: result.owasp_summary || result.data?.owasp_summary || null,
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
      scanResult.overall_risk_level || scanResult.data?.overall_risk_level || null,
    is_error: scanResult.is_error || false,
    error_message: scanResult.error_message || scanResult.error?.message || null,
    error_type: scanResult.error_type || scanResult.error?.type || null,
    http_status_code: scanResult.http_status_code || scanResult.error?.statusCode || null,
    rate_limit: scanResult.rate_limit || null,
    analysis_result: scanResult.analysis_result || scanResult.data || null,
    owasp_summary: scanResult.owasp_summary || scanResult.data?.owasp_summary || null,
    deep_link: deepLink,
  };

  return JSON.stringify(normalized, null, 2);
}
