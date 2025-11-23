#!/usr/bin/env node

/**
 * CLI entry point with proper argument parsing
 */

import { Command } from "commander";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { consola } from "consola";
import { runAllServers } from "./lib/run.js";
import { isError } from "./lib/error.js";
import { checkScan } from "./lib/check.js";
import { scheduleScan } from "./lib/schedule.js";
import { createApiClient } from "./lib/api.js";
import { displayTestingBanner } from "./lib/banner.js";
import {
  formatScanTable,
  formatScanJSON,
  getExitCode,
} from "./lib/formatter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load package.json for version
const pkgPath = join(__dirname, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));

// Initialize Commander
const program = new Command();

program
  .name("cli")
  .description("CLI tool for security scanning")
  .version(pkg.version);

// Helper function to get token from CLI option or environment variable
function getToken(cliToken) {
  const token = cliToken || process.env.APP_TOKEN;
  if (!token) {
    consola.error(
      "Token is required. Provide it via --token option or APP_TOKEN environment variable",
    );
    process.exit(1);
  }
  return token;
}

// Scan command
program
  .command("scan")
  .description("Perform a security scan on MCP servers")
  .requiredOption("-c, --config <path>", "Path to MCP configuration file")
  .option(
    "--token <token>",
    "Authentication token (or set APP_TOKEN environment variable)",
  )
  .option("--verbose", "Enable verbose output")
  .option("--json", "Output results as JSON (for piping to jq or other tools)")
  .option(
    "--fail-on-high",
    "Exit with error code if risk level is high or critical",
  )
  .option("--fail-on-medium", "Exit with error code if risk level is medium")
  .option("--fail-on-low", "Exit with error code if risk level is low")
  .action(
    async ({
      config,
      token,
      verbose,
      json,
      failOnHigh,
      failOnMedium,
      failOnLow,
    }) => {
      // Display testing phase banner immediately
      displayTestingBanner();

      const tokenValue = getToken(token);

      // Configure logger verbosity
      if (verbose) {
        consola.level = 4; // Verbose mode
      }

      if (!json) {
        consola.info(`Running scan with config: ${config}`);
      }
      consola.debug(`Token: ${tokenValue.substring(0, 8)}...`);

      if (verbose) {
        consola.debug("Verbose mode enabled");
      }

      const apiClient = createApiClient(tokenValue);
      if (isError(apiClient)) {
        consola.error("Error creating API client:", apiClient.error);
        process.exit(1);
      }

      // Run MCP servers to discover capabilities
      if (!json) {
        consola.info("Discovering MCP server capabilities...");
      }
      const runResult = await runAllServers(consola, config);
      if (isError(runResult)) {
        consola.error("Error running MCP servers:", runResult.error);
        process.exit(1);
      }
      consola.debug("Fetched MCP results:", JSON.stringify(runResult, null, 2));

      // Perform the scan
      if (!json) {
        consola.info("Submitting scan to security analysis API...");
      }
      const scanResult = await scheduleScan(apiClient, runResult);
      if (isError(scanResult)) {
        consola.error(
          "Error performing scan:",
          JSON.stringify(scanResult, null, 2),
        );
        process.exit(1);
      }

      // Format output
      if (json) {
        console.log(formatScanJSON(scanResult));
      } else {
        formatScanTable(scanResult);
      }

      // Determine exit code
      const exitCode = getExitCode(scanResult, {
        failOnHigh: failOnHigh !== undefined ? failOnHigh : true,
        failOnMedium: failOnMedium || false,
        failOnLow: failOnLow || false,
      });

      if (exitCode !== 0 && !json) {
        consola.warn(
          `Scan completed with risk level that triggers failure (exit code: ${exitCode})`,
        );
      }

      process.exit(exitCode);
    },
  );

// Check command
program
  .command("check")
  .description("Check the status and results of a previously performed scan")
  .requiredOption("-j, --scan-id <scanId>", "Scan ID to check")
  .option(
    "--token <token>",
    "Authentication token (or set APP_TOKEN environment variable)",
  )
  .option("--verbose", "Enable verbose output")
  .option("--json", "Output results as JSON (for piping to jq or other tools)")
  .option(
    "--fail-on-high",
    "Exit with error code if risk level is high or critical",
  )
  .option("--fail-on-medium", "Exit with error code if risk level is medium")
  .option("--fail-on-low", "Exit with error code if risk level is low")
  .action(
    async ({
      scanId,
      token,
      verbose,
      json,
      failOnHigh,
      failOnMedium,
      failOnLow,
    }) => {
      // Display testing phase banner immediately
      displayTestingBanner();

      const tokenValue = getToken(token);

      // Configure logger verbosity
      if (verbose) {
        consola.level = 4; // Verbose mode
      }

      consola.info(`Checking scan: ${scanId}`);
      consola.debug(`Token: ${tokenValue.substring(0, 8)}...`);

      if (verbose) {
        consola.debug("Verbose mode enabled");
      }

      const apiClient = createApiClient(tokenValue);
      if (isError(apiClient)) {
        consola.error("Error creating API client:", apiClient.error);
        process.exit(1);
      }

      consola.debug(`Getting scan: ${scanId}`);
      const checkedScanResult = await checkScan(apiClient, scanId);
      if (isError(checkedScanResult)) {
        consola.error(
          "Error checking scan:",
          JSON.stringify(checkedScanResult, null, 2),
        );
        process.exit(1);
      }

      // Normalize the response - check returns { result: {...} } or direct object
      const scanData = checkedScanResult.result || checkedScanResult;

      // Format output
      if (json) {
        console.log(formatScanJSON(scanData));
      } else {
        formatScanTable(scanData);
      }

      // Determine exit code
      const exitCode = getExitCode(scanData, {
        failOnHigh: failOnHigh !== undefined ? failOnHigh : true,
        failOnMedium: failOnMedium || false,
        failOnLow: failOnLow || false,
      });

      if (exitCode !== 0 && !json) {
        consola.warn(
          `Scan completed with risk level that triggers failure (exit code: ${exitCode})`,
        );
      }

      process.exit(exitCode);
    },
  );

// Parse arguments
program.parse();
