import axios, { isAxiosError } from "axios";

import { MCPError } from "./error.js";

export function getApiBaseUrl() {
  if (process.env.NODE_ENV === "dev") {
    return "http://localhost:3000";
  }
  return "https://smart.mcpshark.sh";
}
export class ApiError extends MCPError {
  constructor(message, code, statusCode) {
    super("ApiError", message);
    this.code = code;
    if (statusCode) {
      this.status = statusCode;
    }
  }
}

function getApiError(error) {
  if (isAxiosError(error)) {
    const { code, message } = error.toJSON();
    return new ApiError(message, code, error?.status);
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
