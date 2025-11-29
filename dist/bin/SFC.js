#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const auth_1 = require("../src/auth");
const clone_1 = require("../src/clone");
const create_1 = require("../src/create");
const playwright_browser_1 = require("../src/playwright-browser");
const program = new commander_1.Command();
program
    .name('SFC')
    .description('CLI tool for cloning Salesforce cases')
    .version('1.0.0');
program
    .command('login')
    .description('Authenticate with Salesforce')
    .action(async () => {
    try {
        await (0, auth_1.authenticate)();
        console.log(chalk_1.default.green('✓ Authentication successful'));
    }
    catch (error) {
        console.error(chalk_1.default.red(`✗ Authentication failed: ${error.message}`));
        process.exit(1);
    }
});
program
    .command('status')
    .description('Check login status')
    .action(async () => {
    try {
        console.log(chalk_1.default.blue('Checking login status...'));
        const isLoggedIn = await (0, auth_1.checkLoginStatus)();
        if (isLoggedIn) {
            console.log(chalk_1.default.green('✓ You are logged in to Salesforce'));
            // Show additional info
            const Configstore = require('configstore');
            const config = new Configstore('SFC');
            const username = config.get('username');
            const loginTime = config.get('loginTime');
            if (username) {
                console.log(chalk_1.default.blue(`  User: ${username}`));
            }
            if (loginTime) {
                const loginDate = new Date(loginTime);
                console.log(chalk_1.default.blue(`  Logged in: ${loginDate.toLocaleString()}`));
            }
        }
        else {
            console.log(chalk_1.default.red('✗ You are not logged in'));
            console.log(chalk_1.default.yellow('Please run "SFC login" to authenticate'));
        }
    }
    catch (error) {
        console.error(chalk_1.default.red(`✗ Status check failed: ${error.message}`));
        process.exit(1);
    }
});
program
    .command('logout')
    .description('Logout from Salesforce')
    .action(async () => {
    try {
        (0, auth_1.logout)();
        console.log(chalk_1.default.green('✓ Successfully logged out'));
    }
    catch (error) {
        console.error(chalk_1.default.red(`✗ Logout failed: ${error.message}`));
        process.exit(1);
    }
});
program
    .command('clone <caseInput>')
    .description('Clone a Salesforce case (provide case number or full URL)')
    .action(async (caseInput) => {
    const spinner = (0, ora_1.default)('Reading case data...').start();
    try {
        await (0, clone_1.cloneCase)(caseInput, spinner);
        spinner.succeed(chalk_1.default.green('Case data copied successfully'));
    }
    catch (error) {
        spinner.fail(chalk_1.default.red(`✗ Cloning failed: ${error.message}`));
        process.exit(1);
    }
    finally {
        await (0, playwright_browser_1.closeBrowser)();
    }
});
program
    .command('create')
    .description('Create new cases from cloned data')
    .option('-b, --batch <number>', 'Number of cases to create', '1')
    .action(async (options) => {
    const batchCount = parseInt(options.batch, 10);
    const spinner = (0, ora_1.default)(`Creating ${batchCount} new cases...`).start();
    try {
        const timeSaved = await (0, create_1.createCases)(batchCount, spinner);
        spinner.succeed(chalk_1.default.green(`Batch creation completed`));
        console.log(chalk_1.default.blue(`💡 Time saved: ${timeSaved} vs manual process`));
    }
    catch (error) {
        spinner.fail(chalk_1.default.red(`✗ Creation failed: ${error.message}`));
        process.exit(1);
    }
    finally {
        await (0, playwright_browser_1.closeBrowser)();
    }
});
program.parse();
//# sourceMappingURL=SFC.js.map