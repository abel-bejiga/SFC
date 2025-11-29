import chalk from 'chalk';
import Configstore from 'configstore';
import {
navigateTo,
waitForElement,
evaluate,
typeText,
clickElement,
initializeBrowser
} from './playwright-browser';
import { checkLoginStatus, verifySession } from './auth';
import { CaseData } from './types';

const config = new Configstore('SFC');

export async function cloneCase(caseInput: string, spinner: any): Promise<CaseData> {
try {
let caseUrl: string;
let caseNumber: string | null;

// Determine case URL or ID
if (caseInput.startsWith('http')) {
  caseUrl = caseInput;
  const urlMatch = caseInput.match(/\/lightning\/r\/Case\/([^\/]+)/);
  caseNumber = urlMatch ? urlMatch[1] : null;
} else if (/^[a-zA-Z0-9]{15,18}$/.test(caseInput)) {
  const instanceUrl = config.get('instanceUrl');
  if (!instanceUrl) throw new Error('No instance URL found. Please run "SFC login" first.');
  caseUrl = `${instanceUrl}/lightning/r/Case/${caseInput}/view`;
  caseNumber = caseInput;
} else {
  throw new Error(`Invalid input. Please provide a valid case URL or Salesforce ID.`);
}

spinner.text = 'Navigating to case...';
console.log(chalk.blue(`→ Navigating to case: ${caseUrl}`));

await initializeBrowser();

try {
  await navigateTo(caseUrl);
} catch (navError) {
  if ((navError as Error).message.includes('Redirected to login page')) {
    spinner.text = 'Session expired, verifying...';
    console.log(chalk.yellow('→ Session expired, verifying...'));
    const isValidSession = await verifySession();
    if (!isValidSession) throw new Error('Session expired. Please run "SFC login" to authenticate again.');
    await navigateTo(caseUrl);
  } else {
    throw navError;
  }
}

spinner.text = 'Scrolling to activate content...';
await scrollPage();

spinner.text = 'Extracting case data...';
console.log(chalk.blue('→ Extracting case data...'));

// Extraction logic focusing on main content container
const caseData: CaseData = await evaluate(() => {
  const mainContainer = document.querySelector('main[role="main"], .region-main');

  const getField = (label: string): string | null => {
    if (!mainContainer) return null;

    const fields = Array.from(mainContainer.querySelectorAll('.slds-form-element'));
    const field = fields.find(f => {
      const labelEl = f.querySelector('.slds-form-element__label, .test-id__field-label');
      return labelEl && labelEl.textContent?.trim().toLowerCase() === label.toLowerCase();
    });

    if (!field) return null;

    const valueEl = field.querySelector(
      'lightning-formatted-text, lightning-formatted-url a, span.slds-truncate, .test-id__field-value, input, textarea'
    );

    if (!valueEl) return null;
    return (valueEl as HTMLElement).textContent?.trim() || (valueEl as HTMLInputElement).value || null;
  };

  const getCaseNumber = (): string | null => {
    const match = window.location.href.match(/\/lightning\/r\/Case\/([^\/]+)/);
    return match ? match[1] : null;
  };

  const getSubject = (): string | null => {
    const subjectEl = mainContainer?.querySelector('h1, h2, h3, .record-title');
    if (subjectEl && subjectEl.textContent?.trim()) return subjectEl.textContent.trim();
    return getField('subject');
  };

  const getAccountName = (): string | null => {
    const link = mainContainer?.querySelector('a[href*="/001"]');
    if (link && link.textContent?.trim()) return link.textContent.trim();
    return getField('account name');
  };

  const getContactName = (): string | null => {
    const link = mainContainer?.querySelector('a[href*="/003"]');
    if (link && link.textContent?.trim()) return link.textContent.trim();
    return getField('contact name');
  };

  const getContactPhone = (): string | null => {
    const link = mainContainer?.querySelector('a[href^="tel:"]');
    if (link && link.textContent?.trim()) return link.textContent.trim();
    return getField('phone');
  };

  return {
    caseNumber: getCaseNumber(),
    subject: getSubject(),
    description: getField('description'),
    status: getField('status'),
    caseOrigin: getField('case origin'),
    accountName: getAccountName(),
    contactName: getContactName(),
    contactPhone: getContactPhone(),
    causeCode1: getField('cause code 1'),
    causeCode2: getField('cause code 2'),
    causeCode3: getField('cause code 3'),
    resolutionLevel1: getField('resolution level 1'),
    resolutionLevel2: getField('resolution level 2'),
    resolutionLevel3: getField('resolution level 3'),
    resolutionDetails: getField('resolution details'),
    resolutionMethod: getField('resolution method'),
    closureDetails: getField('closure details'),
  };
});

// Print key-value formatted output
console.log(chalk.blue('\n────────────────────────────────────────'));
console.log(chalk.blue('  Case Data Extracted'));
console.log(chalk.blue('────────────────────────────────────────'));
Object.entries(caseData).forEach(([key, value]) => {
  console.log(`${key.padEnd(20)}: ${value || 'N/A'}`);
});
console.log(chalk.blue('────────────────────────────────────────\n'));

config.set('clonedCase', caseData);

spinner.text = 'Validating required fields...';
if (!caseData.subject) {
  console.warn(chalk.yellow('⚠ Warning: Subject not found — cloning may require manual verification.'));
}

console.log(chalk.green('✔ Case data copied successfully'));
return caseData;

} catch (error) {
console.error('✖ Failed extracting case data');
throw error;
}
}

async function scrollPage(): Promise<void> {
console.log(chalk.blue('→ Scrolling page to activate dynamic content...'));
await evaluate(() => {
return new Promise<void>((resolve) => {
let scrollTop = 0;
const step = 200;
const interval = setInterval(() => {
scrollTop += step;
window.scrollTo(0, scrollTop);
if (scrollTop > document.body.scrollHeight) {
clearInterval(interval);
window.scrollTo(0, 0);
resolve();
}
}, 100);
});
});
}
