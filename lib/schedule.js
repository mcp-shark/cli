import { createScan } from './api.js';

export function scheduleScan(apiClient, results) {
  return createScan(apiClient, results);
}
