import { isError } from "../error.js";

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
