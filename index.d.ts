import type { AxiosInstance } from "axios";

/**
 * Base error class for all MCP-related errors
 */
export class MCPError extends Error {
  name: string;
  error?: Error;
  constructor(name: string, message: string, error?: Error);
}

/**
 * API-related error
 */
export class ApiError extends MCPError {
  code?: string | number;
  constructor(message: string, code?: string | number);
}

/**
 * Configuration parsing error
 */
export class ConfigError extends MCPError {
  constructor(message: string, error?: Error);
}

/**
 * Server execution error
 * Thrown when errors occur during MCP server execution
 */
export class RunError extends MCPError {
  errors: MCPError[];
  constructor(message: string, error?: Error, errors?: Error[]);
}

/**
 * Logger interface for runServer and runAllServers
 */
export interface Logger {
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
  success(...args: unknown[]): void;
}

/**
 * Server configuration for MCP servers
 * Compatible with MCP configuration files used by Cursor, Claude Desktop, and other IDEs
 *
 * Transport types:
 * - stdio (default): requires 'command', optional 'args' and 'env'
 * - http/sse/streamable-http: requires 'url', optional 'headers'
 * - ws/websocket: requires 'url'
 */
export interface ServerConfig {
  /** Transport type: 'stdio', 'http', 'sse', 'streamable-http', 'ws', or 'websocket' (defaults to 'stdio') */
  type?: "stdio" | "http" | "sse" | "streamable-http" | "ws" | "websocket";
  /** Command to run (required for stdio transport) */
  command?: string;
  /** Command arguments (for stdio transport) */
  args?: string[];
  /** Environment variables (for stdio transport) */
  env?: Record<string, string>;
  /** Server URL (required for http/sse/streamable-http/ws/websocket transports) */
  url?: string;
  /** HTTP headers (for http/sse/streamable-http transports) */
  headers?: Record<string, string>;
}

/**
 * MCP configuration file structure
 * Supports both 'servers' (old format) and 'mcpServers' (new format)
 * Compatible with Cursor, Claude Desktop, and other IDE configurations
 */
export interface MCPConfigFile {
  /**
   * Legacy servers format (still supported)
   */
  servers?: Record<string, ServerConfig>;
  /**
   * Modern MCP servers format (preferred)
   */
  mcpServers?: Record<string, ServerConfig>;
}

/**
 * Scan result item
 */
export interface ScanResult {
  name: string;
  description?: string;
}

/**
 * Server run result
 */
export interface ServerRunResult {
  name: string;
  tools: ScanResult[];
  resources: ScanResult[];
  prompts: ScanResult[];
}

/**
 * Scan data returned from API
 */
export interface ScanData {
  id: string;
  [key: string]: unknown;
}

/**
 * Create an API client instance
 * @param apiKey - Authentication token for the API
 * @returns Axios instance configured for the API
 * @throws {ApiError} If apiKey is not provided
 */
export function createApiClient(apiKey: string): AxiosInstance;

/**
 * Create a new scan via the API
 * @param apiClient - API client instance
 * @param scan - Scan data to submit
 * @returns Scan data with ID or ApiError if request fails
 */
export function createScan(
  apiClient: AxiosInstance,
  scan: ServerRunResult | ServerRunResult[]
): Promise<ScanData | ApiError>;

/**
 * Get scan details by ID
 * @param apiClient - API client instance
 * @param scanId - Scan ID to retrieve
 * @returns Scan data or ApiError if request fails
 */
export function getScan(apiClient: AxiosInstance, scanId: string): Promise<ScanData | ApiError>;

/**
 * Schedule a scan by submitting server run results
 * @param apiClient - API client instance
 * @param results - Server run results to submit
 * @returns Scan data with ID or ApiError if request fails
 */
export function scheduleScan(
  apiClient: AxiosInstance,
  results: ServerRunResult | ServerRunResult[]
): Promise<ScanData | ApiError>;

/**
 * Check scan status by ID
 * @param apiClient - API client instance
 * @param scanId - Scan ID to check
 * @returns Scan data or ApiError if request fails
 */
export function checkScan(apiClient: AxiosInstance, scanId: string): Promise<ScanData | ApiError>;

/**
 * Run a single MCP server and collect its capabilities
 * @param options - Options for running the server
 * @param options.logger - Logger instance for debug/info output
 * @param options.name - Server name
 * @param options.config - Server configuration
 * @returns Server run result or RunError if execution fails
 */
export function runServer(options: {
  logger: Logger;
  name: string;
  config: ServerConfig;
}): Promise<ServerRunResult | RunError>;

/**
 * Run all MCP servers from a configuration file
 * @param logger - Logger instance for debug/info output
 * @param configPath - Path to MCP configuration file
 * @returns Array of server run results or RunError if execution fails
 */
export function runAllServers(
  logger: Logger,
  configPath: string
): Promise<ServerRunResult[] | RunError>;
