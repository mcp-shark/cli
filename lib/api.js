import axios, { isAxiosError } from "axios";

import { MCPError } from "./error.js";

export function getApiBaseUrl() {
  return "https://smart.mcpshark.sh";
}
export class ApiError extends MCPError {
  constructor(message, code, statusCode, details = null) {
    super("ApiError", message);
    this.code = code;
    if (statusCode) {
      this.status = statusCode;
    }
    this.details = details;
  }
}

function getApiError(error) {
  if (isAxiosError(error)) {
    const { code, message } = error.toJSON();
    const statusCode = error.response?.status || error?.status;

    // Extract validation error details from response body
    const responseData = error.response?.data;
    const details = responseData
      ? responseData.error === "Validation failed" && responseData.details
        ? responseData.details
        : responseData.error || responseData.message || null
      : null;

    // Build a more descriptive error message for validation errors
    const errorMessage =
      statusCode === 400 && details
        ? Array.isArray(details)
          ? `Validation failed: ${details
              .map((d) => {
                if (typeof d === "string") return d;
                if (d.field && d.message) return `${d.field}: ${d.message}`;
                return JSON.stringify(d);
              })
              .join("; ")}`
          : typeof details === "string"
            ? `Validation failed: ${details}`
            : message
        : details && typeof details === "string"
          ? details
          : message;

    return new ApiError(errorMessage, code, statusCode, details);
  }
  return new ApiError(error.message, error.code);
}

export function createApiClient(apiKey) {
  if (!apiKey) {
    throw new ApiError("API key is required");
  }
  return axios.create({
    baseURL: getApiBaseUrl(),
    headers: {
      timeout: 1000,
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
  });
}

export async function createScan(apiClient, scan) {
  try {
    const { data } = await apiClient.post("/api/scans", scan);
    return data;
  } catch (error) {
    return getApiError(error);
  }
}

export async function getScan(apiClient, scanId) {
  try {
    const { data } = await apiClient.get(`/api/scans/${scanId}`);
    return data;
  } catch (error) {
    return getApiError(error);
  }
}
