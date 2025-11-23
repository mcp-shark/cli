#!/usr/bin/env node

/**
 * CLI entry point with proper argument parsing
 */

import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { consola } from 'consola';
import { runAllServers } from './lib/run.js';
import { isError } from './lib/error.js';
import { checkScan } from './lib/check.js';
import { scheduleScan } from './lib/schedule.js';
import { createApiClient } from './lib/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load package.json for version
const pkgPath = join(__dirname, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

// Initialize Commander
const program = new Command();

program
  .name('cli')
  .description('CLI tool for security scanning')
  .version(pkg.version);

// Helper function to get token from CLI option or environment variable
function getToken(cliToken) {
  const token = cliToken || process.env.APP_TOKEN;
  if (!token) {
    consola.error(
      'Token is required. Provide it via --token option or APP_TOKEN environment variable'
    );
    process.exit(1);
  }
  return token;
}

// Schedule command
program
  .command('schedule')
  .description('Schedule a task')
  .requiredOption('-c, --config <path>', 'Path to configuration file')
  .option(
    '--token <token>',
    'Authentication token (or set APP_TOKEN environment variable)'
  )
  .option('-d, --dry-run', 'Run in dry-run mode (no changes will be made)')
  .option('--verbose', 'Enable verbose output')
  .action(async ({ config, token, dryRun, verbose }) => {
    const tokenValue = getToken(token);

    // Configure logger verbosity
    if (verbose) {
      consola.level = 4; // Verbose mode
    }

    consola.info(`Scheduling with config: ${config}`);
    consola.debug(`Token: ${tokenValue.substring(0, 8)}...`);

    if (dryRun) {
      consola.warn('Dry-run mode enabled - no changes will be made');
    }

    if (verbose) {
      consola.debug('Verbose mode enabled');
    }

    const apiClient = createApiClient(tokenValue);
    if (isError(apiClient)) {
      consola.error('Error creating API client:', apiClient.error);
      process.exit(1);
    }

    // Run MCP
    const runResult = await runAllServers(consola, config);
    if (isError(runResult)) {
      consola.error('Error running MCP:', runResult.error);
      process.exit(1);
    }
    consola.debug('Fetched MCP results:', JSON.stringify(runResult, null, 2));

    const scheduledScanResult = await scheduleScan(apiClient, runResult);
    if (isError(scheduledScanResult)) {
      consola.error(
        'Error scheduling scan:',
        JSON.stringify(scheduledScanResult, null, 2)
      );
      process.exit(1);
    }
    consola.debug(
      'Scheduled scan:',
      JSON.stringify(scheduledScanResult, null, 2)
    );
    consola.success(
      'Schedule command executed',
      `Scan ID: ${scheduledScanResult.id}`
    );
  });

// Check command
program
  .command('check')
  .description('Check a job')
  .requiredOption('-j, --scan-id <scanId>', 'Scan ID to check')
  .option(
    '--token <token>',
    'Authentication token (or set APP_TOKEN environment variable)'
  )
  .option('--verbose', 'Enable verbose output')
  .action(async ({ scanId, token, verbose }) => {
    const tokenValue = getToken(token);

    // Configure logger verbosity
    if (verbose) {
      consola.level = 4; // Verbose mode
    }

    consola.info(`Checking scan: ${scanId}`);
    consola.debug(`Token: ${tokenValue.substring(0, 8)}...`);

    if (verbose) {
      consola.debug('Verbose mode enabled');
    }

    const apiClient = createApiClient(tokenValue);
    if (isError(apiClient)) {
      consola.error('Error creating API client:', apiClient.error);
      process.exit(1);
    }

    consola.debug(`Getting scan: ${scanId}`);
    const checkedScanResult = await checkScan(apiClient, scanId);
    if (isError(checkedScanResult)) {
      consola.error(
        'Error checking scan:',
        JSON.stringify(checkedScanResult, null, 2)
      );
      process.exit(1);
    }
    consola.success(
      'Check command executed',
      JSON.stringify(checkedScanResult, null, 2)
    );
    consola.info('Scan details:', JSON.stringify(checkedScanResult, null, 2));
  });

// Parse arguments
program.parse();
