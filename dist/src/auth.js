"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.checkLoginStatus = checkLoginStatus;
exports.verifySession = verifySession;
exports.logout = logout;
const chalk_1 = __importDefault(require("chalk"));
const configstore_1 = __importDefault(require("configstore"));
const inquirer = require('inquirer');
const { navigateTo, waitForElement, typeText, clickElement, saveSession, evaluate, initializeBrowser, closeBrowser } = require('./playwright-browser');
const config = new configstore_1.default("SFC");
async function authenticate() {
    // Check if already authenticated
    if (config.get('authenticated')) {
        console.log(chalk_1.default.yellow('Already authenticated. Use logout first to re-authenticate.'));
        return;
    }
    // Prompt for credentials
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'username',
            message: 'Enter your Salesforce username:',
            validate: input => input.length > 0 || 'Username is required'
        },
        {
            type: 'password',
            name: 'password',
            message: 'Enter your Salesforce password:',
            validate: input => input.length > 0 || 'Password is required'
        },
        {
            type: 'input',
            name: 'instanceUrl',
            message: 'Enter your Salesforce Lightning URL:',
            default: 'https://idemia-us.lightning.force.com'
        }
    ]);
    try {
        // Initialize browser for authentication
        await initializeBrowser();
        // Navigate to login page
        await navigateTo(answers.instanceUrl);
        // Wait for username field and enter credentials
        await waitForElement('#username');
        await typeText('#username', answers.username);
        await typeText('#password', answers.password);
        // Click login button
        await clickElement('#Login');
        console.log(chalk_1.default.yellow('Login initiated. If you receive a verification code on your phone, please complete the verification.'));
        // Check if we need to handle MFA
        let mfaRequired = false;
        try {
            // Check for MFA verification screen
            await waitForElement('#challengeQuestion', 5000);
            console.log(chalk_1.default.yellow('Multi-factor authentication required. Please complete verification on your phone.'));
            mfaRequired = true;
        }
        catch (e) {
            // MFA screen not found, continue
        }
        if (!mfaRequired) {
            try {
                // Check for verification code entry screen
                await waitForElement('#smc', 5000);
                console.log(chalk_1.default.yellow('Verification code required. Please enter the code sent to your device.'));
                // Prompt for verification code
                const codeAnswer = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'verificationCode',
                        message: 'Enter verification code:',
                        validate: input => input.length > 0 || 'Verification code is required'
                    }
                ]);
                // Enter verification code
                await typeText('#smc', codeAnswer.verificationCode);
                await clickElement('#save');
            }
            catch (codeError) {
                // No verification code screen
            }
        }
        // Wait for login to complete (with longer timeout for MFA)
        console.log(chalk_1.default.yellow('Waiting for login to complete (this may take up to 60 seconds if MFA is required)...'));
        try {
            // First try to wait for the waffle icon with a longer timeout
            await waitForElement('.slds-icon-waffle', 60000);
        }
        catch (e) {
            // If waffle icon not found, check if we're on a different page after login
            try {
                // Check if we're on the home page or any other Salesforce page
                const currentUrl = await evaluate(() => window.location.href);
                if (currentUrl.includes('lightning.force.com')) {
                    console.log(chalk_1.default.green('Login appears successful based on URL.'));
                }
                else {
                    throw new Error('Unable to verify successful login');
                }
            }
            catch (urlError) {
                throw new Error('Login verification failed. Please check your credentials and try again.');
            }
        }
        // Save session and authentication data
        await saveSession();
        config.set('authenticated', true);
        config.set('instanceUrl', answers.instanceUrl);
        config.set('username', answers.username);
        config.set('loginTime', new Date().toISOString());
        console.log(chalk_1.default.green('Authentication successful!'));
    }
    catch (error) {
        console.error(chalk_1.default.red('Authentication failed:'), error.message);
        throw error;
    }
    finally {
        await closeBrowser();
    }
}
async function checkLoginStatus() {
    // Simple check: just verify we have the required auth data
    const authenticated = config.get('authenticated');
    const instanceUrl = config.get('instanceUrl');
    const username = config.get('username');
    const loginTime = config.get('loginTime');
    if (!authenticated || !instanceUrl || !username) {
        return false;
    }
    // Check if login was within the last 24 hours
    if (loginTime) {
        const loginDate = new Date(loginTime);
        const now = new Date();
        const hoursSinceLogin = (now - loginDate) / (1000 * 60 * 60);
        if (hoursSinceLogin > 24) {
            return false;
        }
    }
    return true;
}
async function verifySession() {
    // This function actually tries to access Salesforce to verify the session
    // It's used by the clone command when needed
    try {
        await initializeBrowser();
        const instanceUrl = config.get('instanceUrl');
        await navigateTo(instanceUrl);
        // Check if we're on a login page
        const currentUrl = await evaluate(() => window.location.href);
        if (currentUrl.includes('login') || currentUrl.includes('Login')) {
            return false;
        }
        // Try to find the waffle icon
        const hasWaffleIcon = await evaluate(() => {
            return !!document.querySelector('.slds-icon-waffle');
        });
        return hasWaffleIcon;
    }
    catch (error) {
        return false;
    }
    finally {
        await closeBrowser();
    }
}
function logout() {
    config.clear();
    console.log(chalk_1.default.green('Successfully logged out'));
}
//# sourceMappingURL=auth.js.map