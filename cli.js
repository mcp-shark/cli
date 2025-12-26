#!/usr/bin/env node

/**
 * CLI entry point with proper argument parsing
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { consola } from "consola";
import { handleCheckCommand } from "./lib/commands/check.js";
import { handleScanCommand } from "./lib/commands/scan.js";
import { handleSmartAgentAnalyzeCommand } from "./lib/commands/smart-agent-analyze.js";
import { handleSmartAgentScanCommand } from "./lib/commands/smart-agent-scan.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load package.json for version
const pkgPath = join(__dirname, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));

// Initialize Commander
const program = new Command();

program.name("cli").description("CLI tool for security scanning").version(pkg.version);

// Helper function to get token from CLI option or environment variable
function getToken(cliToken) {
  const token = cliToken || process.env.APP_TOKEN;
  if (!token) {
    consola.error(
      "Token is required. Provide it via --token option or APP_TOKEN environment variable"
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
  .option("--token <token>", "Authentication token (or set APP_TOKEN environment variable)")
  .option("--verbose", "Enable verbose output")
  .option("--json", "Output results as JSON (for piping to jq or other tools)")
  .option("--fail-on-high", "Exit with error code if risk level is high or critical")
  .option("--fail-on-medium", "Exit with error code if risk level is medium")
  .option("--fail-on-low", "Exit with error code if risk level is low")
  .action(async (options) => {
    await handleScanCommand({ ...options, getToken });
  });

// Check command
program
  .command("check")
  .description("Check the status and results of a previously performed scan")
  .requiredOption("-j, --scan-id <scanId>", "Scan ID to check")
  .option("--token <token>", "Authentication token (or set APP_TOKEN environment variable)")
  .option("--verbose", "Enable verbose output")
  .option("--json", "Output results as JSON (for piping to jq or other tools)")
  .option("--fail-on-high", "Exit with error code if risk level is high or critical")
  .option("--fail-on-medium", "Exit with error code if risk level is medium")
  .option("--fail-on-low", "Exit with error code if risk level is low")
  .action(async (options) => {
    await handleCheckCommand({ ...options, getToken });
  });

// Smart Agent commands
const smartAgentCommand = new Command("smart-agent").description(
  "Smart Agent: Scan agents and detect privilege escalation paths"
);

// Smart Agent scan subcommand
smartAgentCommand
  .command("scan")
  .description("Scan agent card or MCP server data and submit to API")
  .requiredOption(
    "-i, --input <path>",
    "Path to agent card JSON file or URL to download agent card from"
  )
  .option("--token <token>", "Authentication token (or set APP_TOKEN environment variable)")
  .option("--verbose", "Enable verbose output")
  .option("--json", "Output results as JSON (for piping to jq or other tools)")
  .option("--fail-on-high", "Exit with error code if risk level is high or critical")
  .option("--fail-on-medium", "Exit with error code if risk level is medium")
  .option("--fail-on-low", "Exit with error code if risk level is low")
  .action(async (options) => {
    await handleSmartAgentScanCommand({ ...options, getToken });
  });

// Smart Agent analyze subcommand
smartAgentCommand
  .command("analyze")
  .description("Perform local analysis without API submission")
  .requiredOption("-i, --input <path>", "Path to agent card JSON or MCP server data JSON")
  .option("-o, --output <path>", "Output file path (default: stdout)")
  .option("-f, --format <format>", "Output format: sarif or json (default: json)", "json")
  .option("--verbose", "Enable verbose output")
  .action(async (options) => {
    await handleSmartAgentAnalyzeCommand(options);
  });

program.addCommand(smartAgentCommand);

// Parse arguments
program.parse();
