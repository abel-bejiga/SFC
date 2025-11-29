#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { authenticate, checkLoginStatus, logout } from '../src/auth';
import { cloneCase } from '../src/clone';
import { createCases } from '../src/create';
import { closeBrowser } from '../src/playwright-browser';

const program = new Command();

program
  .name('SFC')
  .description('CLI tool for cloning Salesforce cases')
  .version('1.0.0');

program
  .command('login')
  .description('Authenticate with Salesforce')
  .action(async () => {
    try {
      await authenticate();
      console.log(chalk.green('✓ Authentication successful'));
    } catch (error) {
      console.error(chalk.red(`✗ Authentication failed: ${(error as Error).message}`));
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Check login status')
  .action(async () => {
    try {
      console.log(chalk.blue('Checking login status...'));
      const isLoggedIn = await checkLoginStatus();
      
      if (isLoggedIn) {
        console.log(chalk.green('✓ You are logged in to Salesforce'));
        
        // Show additional info
        const Configstore = require('configstore');
        const config = new Configstore('SFC');
        const username = config.get('username');
        const loginTime = config.get('loginTime');
        
        if (username) {
          console.log(chalk.blue(`  User: ${username}`));
        }
        if (loginTime) {
          const loginDate = new Date(loginTime);
          console.log(chalk.blue(`  Logged in: ${loginDate.toLocaleString()}`));
        }
      } else {
        console.log(chalk.red('✗ You are not logged in'));
        console.log(chalk.yellow('Please run "SFC login" to authenticate'));
      }
    } catch (error) {
      console.error(chalk.red(`✗ Status check failed: ${(error as Error).message}`));
      process.exit(1);
    }
  });

program
  .command('logout')
  .description('Logout from Salesforce')
  .action(async () => {
    try {
      logout();
      console.log(chalk.green('✓ Successfully logged out'));
    } catch (error) {
      console.error(chalk.red(`✗ Logout failed: ${(error as Error).message}`));
      process.exit(1);
    }
  });

program
  .command('clone <caseInput>')
  .description('Clone a Salesforce case (provide case number or full URL)')
  .action(async (caseInput: string) => {
    const spinner = ora('Reading case data...').start();
    try {
      await cloneCase(caseInput, spinner);
      spinner.succeed(chalk.green('Case data copied successfully'));
    } catch (error) {
      spinner.fail(chalk.red(`✗ Cloning failed: ${(error as Error).message}`));
      process.exit(1);
    } finally {
      await closeBrowser();
    }
  });

program
  .command('create')
  .description('Create new cases from cloned data')
  .option('-b, --batch <number>', 'Number of cases to create', '1')
  .action(async (options: { batch: string }) => {
    const batchCount = parseInt(options.batch, 10);
    const spinner = ora(`Creating ${batchCount} new cases...`).start();
    try {
      const timeSaved = await createCases(batchCount, spinner);
      spinner.succeed(chalk.green(`Batch creation completed`));
      console.log(chalk.blue(`💡 Time saved: ${timeSaved} vs manual process`));
    } catch (error) {
      spinner.fail(chalk.red(`✗ Creation failed: ${(error as Error).message}`));
      process.exit(1);
    } finally {
      await closeBrowser();
    }
  });

program.parse();