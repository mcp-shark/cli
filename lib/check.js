import { getScan } from "./api.js";

export function checkScan(apiClient, scanId) {
  return getScan(apiClient, scanId);
}
