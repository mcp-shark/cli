import axios, { isAxiosError } from 'axios';

import { MCPError } from './error.js';

const API_BASE_URL = process.env.API_BASE_URL;

export class ApiError extends MCPError {
  constructor(message, code) {
    super('ApiError', message);
    this.code = code;
  }
}

function getApiError(error) {
  if (isAxiosError(error)) {
    const { code, message } = error.toJSON();
    return new ApiError(message, code);
  }
  return new ApiError(error.message, error.code);
}

export function createApiClient(apiKey, baseUrl = API_BASE_URL) {
  if (!baseUrl) {
    throw new ApiError('API base URL is required');
  }
  if (!apiKey) {
    throw new ApiError('API key is required');
  }
  return axios.create({
    baseURL: baseUrl,
    headers: {
      timeout: 1000,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
  });
}

export async function createScan(apiClient, scan) {
  try {
    const { data } = await apiClient.post('/v1/scans', scan);
    return data;
  } catch (error) {
    return getApiError(error);
  }
}

export async function getScan(apiClient, scanId) {
  try {
    const { data } = await apiClient.get(`/v1/scans/${scanId}`);
    return data;
  } catch (error) {
    return getApiError(error);
  }
}
