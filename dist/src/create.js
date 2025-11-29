"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloneCase = cloneCase;
const chalk_1 = __importDefault(require("chalk"));
const configstore_1 = __importDefault(require("configstore"));
const playwright_browser_1 = require("./playwright-browser");
const auth_1 = require("./auth");
const config = new configstore_1.default('SFC');
async function cloneCase(caseInput, spinner) {
    try {
        let caseUrl;
        let caseNumber;
        // Check if input is a URL
        if (caseInput.startsWith('http')) {
            caseUrl = caseInput;
            // Extract case ID from URL
            const urlMatch = caseInput.match(/\/lightning\/r\/Case\/([^\/]+)/);
            if (urlMatch) {
                caseNumber = urlMatch[1];
            }
        }
        // Check if input looks like a Salesforce ID
        else if (/^[a-zA-Z0-9]{15,18}$/.test(caseInput)) {
            const instanceUrl = config.get('instanceUrl');
            if (!instanceUrl) {
                throw new Error('No instance URL found. Please run "SFC login" first.');
            }
            caseUrl = `${instanceUrl}/lightning/r/Case/${caseInput}/view`;
            caseNumber = caseInput;
        }
        // Otherwise, treat as case number
        else {
            throw new Error(`Invalid input. Please provide a valid case URL or Salesforce ID.`);
        }
        spinner.text = 'Navigating to case...';
        console.log(chalk_1.default.blue(`→ Navigating to case: ${caseUrl}`));
        // Initialize browser and navigate to case
        await (0, playwright_browser_1.initializeBrowser)();
        try {
            await (0, playwright_browser_1.navigateTo)(caseUrl);
        }
        catch (navError) {
            if (navError.message.includes('Redirected to login page')) {
                // Session is invalid, try to verify
                spinner.text = 'Session expired, verifying...';
                console.log(chalk_1.default.yellow('→ Session expired, verifying...'));
                const isValidSession = await (0, auth_1.verifySession)();
                if (!isValidSession) {
                    throw new Error('Session expired. Please run "SFC login" to authenticate again.');
                }
                // If verification passed, try navigating again
                await (0, playwright_browser_1.navigateTo)(caseUrl);
            }
            else {
                throw navError;
            }
        }
        spinner.text = 'Loading case page...';
        console.log(chalk_1.default.blue('→ Case page loaded, activating hidden elements...'));
        // Scroll to bottom and back to top to activate hidden elements
        await scrollPage();
        spinner.text = 'Extracting case data...';
        console.log(chalk_1.default.blue('→ Extracting case data...'));
        // Wait a bit more for any dynamic content to load
        await new Promise(resolve => setTimeout(resolve, 3000));
        // Extract case data using Salesforce's Lightning DOM structure
        const caseData = await (0, playwright_browser_1.evaluate)(() => {
            // Helper function to find field value by label text, focusing on region-main
            const findFieldValueByLabel = (labelText) => {
                // First, try to find the main content area with region-main class
                const mainContent = document.querySelector('.region-main');
                // If region-main is found, search within it
                if (mainContent) {
                    // Look for the label in various possible containers within region-main
                    const labelSelectors = [
                        'label',
                        'span',
                        'div',
                        '.slds-form-element__label',
                        '.test-id__field-label'
                    ];
                    for (const selector of labelSelectors) {
                        const labels = Array.from(mainContent.querySelectorAll(selector));
                        const labelEl = labels.find(el => el.textContent && el.textContent.trim().toLowerCase().includes(labelText.toLowerCase()));
                        if (labelEl) {
                            // Find the associated value element
                            // Try different ways to find the value based on DOM structure
                            const formElement = labelEl.closest('.slds-form-element') ||
                                labelEl.closest('.slds-form-element__row') ||
                                labelEl.closest('.slds-grid') ||
                                labelEl.closest('div') ||
                                labelEl.parentElement;
                            if (formElement) {
                                // Try different value selectors
                                const valueSelectors = [
                                    '.slds-form-element__control',
                                    '.slds-truncate',
                                    '.test-id__field-value',
                                    'lightning-formatted-text',
                                    'lightning-formatted-url',
                                    'span',
                                    'div',
                                    'input',
                                    'textarea'
                                ];
                                for (const valueSelector of valueSelectors) {
                                    const valueEl = formElement.querySelector(valueSelector);
                                    if (valueEl && valueEl.textContent && valueEl.textContent.trim()) {
                                        return valueEl.textContent.trim();
                                    }
                                    // Also check for input values
                                    if (valueEl && valueEl.value) {
                                        return valueEl.value;
                                    }
                                }
                            }
                        }
                    }
                }
                // If not found in region-main, try the entire document as fallback
                const labelSelectors = [
                    'label',
                    'span',
                    'div',
                    '.slds-form-element__label',
                    '.test-id__field-label'
                ];
                for (const selector of labelSelectors) {
                    const labels = Array.from(document.querySelectorAll(selector));
                    const labelEl = labels.find(el => el.textContent && el.textContent.trim().toLowerCase().includes(labelText.toLowerCase()));
                    if (labelEl) {
                        // Find the associated value element
                        const formElement = labelEl.closest('.slds-form-element') ||
                            labelEl.closest('.slds-form-element__row') ||
                            labelEl.closest('.slds-grid') ||
                            labelEl.closest('div') ||
                            labelEl.parentElement;
                        if (formElement) {
                            // Try different value selectors
                            const valueSelectors = [
                                '.slds-form-element__control',
                                '.slds-truncate',
                                '.test-id__field-value',
                                'lightning-formatted-text',
                                'lightning-formatted-url',
                                'span',
                                'div',
                                'input',
                                'textarea'
                            ];
                            for (const valueSelector of valueSelectors) {
                                const valueEl = formElement.querySelector(valueSelector);
                                if (valueEl && valueEl.textContent && valueEl.textContent.trim()) {
                                    return valueEl.textContent.trim();
                                }
                                // Also check for input values
                                if (valueEl && valueEl.value) {
                                    return valueEl.value;
                                }
                            }
                        }
                    }
                }
                return null;
            };
            // Get case number from URL
            const getCaseNumber = () => {
                const urlMatch = window.location.href.match(/\/lightning\/r\/Case\/([^\/]+)/);
                return urlMatch ? urlMatch[1] : null;
            };
            // Get subject from page title or header
            const getSubject = () => {
                // Try page title first
                const title = document.title;
                if (title) {
                    const titleMatch = title.match(/^(.*?)\s*\|/);
                    if (titleMatch)
                        return titleMatch[1].trim();
                }
                // Try to find any header that might contain the subject
                const headers = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
                for (const header of headers) {
                    if (header.textContent && header.textContent.trim() &&
                        !header.textContent.includes('|') &&
                        !header.textContent.toLowerCase().includes('salesforce')) {
                        return header.textContent.trim();
                    }
                }
                return null;
            };
            // Get status
            const getStatus = () => {
                return findFieldValueByLabel('status');
            };
            // Get account name
            const getAccountName = () => {
                // Try specific Salesforce selectors first
                const accountSelectors = [
                    'force-lookup[data-output-element-id="output-field"] records-hoverable-link a span span',
                    'a[title*="Account"]',
                    'a[href*="001"]'
                ];
                for (const selector of accountSelectors) {
                    const element = document.querySelector(selector);
                    if (element && element.textContent && element.textContent.trim()) {
                        return element.textContent.trim();
                    }
                }
                return findFieldValueByLabel('account');
            };
            // Get contact name
            const getContactName = () => {
                // Try specific Salesforce selectors first
                const contactSelectors = [
                    'a[title*="Contact"]',
                    'a[href*="003"]'
                ];
                for (const selector of contactSelectors) {
                    const element = document.querySelector(selector);
                    if (element && element.textContent && element.textContent.trim()) {
                        return element.textContent.trim();
                    }
                }
                return findFieldValueByLabel('contact');
            };
            // Get contact phone
            const getContactPhone = () => {
                // Try specific phone selectors
                const phoneSelectors = [
                    'lightning-formatted-phone a[href^="tel:"]',
                    'a[href^="tel:"]'
                ];
                for (const selector of phoneSelectors) {
                    const element = document.querySelector(selector);
                    if (element && element.textContent && element.textContent.trim()) {
                        return element.textContent.trim();
                    }
                }
                return findFieldValueByLabel('phone');
            };
            // Get description
            const getDescription = () => {
                // Try specific description selectors
                const descSelectors = [
                    'lightning-formatted-text[data-output-field-id="Description"]',
                    'textarea[name="Description"]',
                    'div[data-field-name="Description"]'
                ];
                for (const selector of descSelectors) {
                    const element = document.querySelector(selector);
                    if (element && element.textContent && element.textContent.trim()) {
                        return element.textContent.trim();
                    }
                }
                return findFieldValueByLabel('description');
            };
            // Get case origin
            const getCaseOrigin = () => {
                return findFieldValueByLabel('case origin');
            };
            // Get cause codes
            const getCauseCode1 = () => findFieldValueByLabel('cause code 1');
            const getCauseCode2 = () => findFieldValueByLabel('cause code 2');
            const getCauseCode3 = () => findFieldValueByLabel('cause code 3');
            // Get resolution levels
            const getResolutionLevel1 = () => findFieldValueByLabel('resolution level 1');
            const getResolutionLevel2 = () => findFieldValueByLabel('resolution level 2');
            const getResolutionLevel3 = () => findFieldValueByLabel('resolution level 3');
            // Get resolution details
            const getResolutionDetails = () => findFieldValueByLabel('resolution details');
            // Get resolution method
            const getResolutionMethod = () => findFieldValueByLabel('resolution method');
            // Get closure details
            const getClosureDetails = () => findFieldValueByLabel('closure details');
            return {
                caseNumber: getCaseNumber(),
                subject: getSubject(),
                description: getDescription(),
                status: getStatus(),
                caseOrigin: getCaseOrigin(),
                accountName: getAccountName(),
                contactName: getContactName(),
                contactPhone: getContactPhone(),
                causeCode1: getCauseCode1(),
                causeCode2: getCauseCode2(),
                causeCode3: getCauseCode3(),
                resolutionLevel1: getResolutionLevel1(),
                resolutionLevel2: getResolutionLevel2(),
                resolutionLevel3: getResolutionLevel3(),
                resolutionDetails: getResolutionDetails(),
                resolutionMethod: getResolutionMethod(),
                closureDetails: getClosureDetails()
            };
        });
        // Log extracted data
        console.log(chalk_1.default.blue('→ Case data extracted:'));
        console.log(chalk_1.default.gray(`  Case Number: ${caseData.caseNumber || 'N/A'}`));
        console.log(chalk_1.default.gray(`  Subject: ${caseData.subject || 'N/A'}`));
        console.log(chalk_1.default.gray(`  Status: ${caseData.status || 'N/A'}`));
        console.log(chalk_1.default.gray(`  Account: ${caseData.accountName || 'N/A'}`));
        console.log(chalk_1.default.gray(`  Contact: ${caseData.contactName || 'N/A'}`));
        console.log(chalk_1.default.gray(`  Phone: ${caseData.contactPhone || 'N/A'}`));
        console.log(chalk_1.default.gray(`  Origin: ${caseData.caseOrigin || 'N/A'}`));
        console.log(chalk_1.default.gray(`  Description: ${caseData.description ? caseData.description.substring(0, 100) + '...' : 'N/A'}`));
        // Store cloned data
        config.set('clonedCase', caseData);
        spinner.text = 'Validating required fields...';
        console.log(chalk_1.default.blue('→ Validating required fields...'));
        // Validate required fields
        if (!caseData.subject) {
            throw new Error('Subject is required but not found in the case');
        }
        console.log(chalk_1.default.green('✓ Case data successfully cloned'));
        return caseData;
    }
    catch (error) {
        console.error('Error cloning case:', error);
        throw error;
    }
}
async function scrollPage() {
    console.log(chalk_1.default.blue('→ Scrolling to bottom of page...'));
    // Scroll to bottom in steps to ensure all lazy-loaded content is activated
    await (0, playwright_browser_1.evaluate)(() => {
        return new Promise((resolve) => {
            let currentScroll = 0;
            const maxScroll = document.documentElement.scrollHeight;
            const step = maxScroll / 10;
            const scrollStep = () => {
                currentScroll += step;
                if (currentScroll >= maxScroll) {
                    window.scrollTo(0, maxScroll);
                    setTimeout(resolve, 1000);
                }
                else {
                    window.scrollTo(0, currentScroll);
                    setTimeout(scrollStep, 200);
                }
            };
            scrollStep();
        });
    });
    console.log(chalk_1.default.blue('→ Scrolling back to top...'));
    // Scroll back to top in steps
    await (0, playwright_browser_1.evaluate)(() => {
        return new Promise((resolve) => {
            let currentScroll = document.documentElement.scrollHeight;
            const step = currentScroll / 10;
            const scrollStep = () => {
                currentScroll -= step;
                if (currentScroll <= 0) {
                    window.scrollTo(0, 0);
                    setTimeout(resolve, 500);
                }
                else {
                    window.scrollTo(0, currentScroll);
                    setTimeout(scrollStep, 200);
                }
            };
            scrollStep();
        });
    });
}
//# sourceMappingURL=create.js.map