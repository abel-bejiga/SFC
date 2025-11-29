"use strict";
const chalk = require('chalk');
function logSuccess(message) {
    console.log(chalk.green(`✓ ${message}`));
}
function logError(message) {
    console.error(chalk.red(`✗ ${message}`));
}
function logInfo(message) {
    console.log(chalk.blue(`→ ${message}`));
}
function logWarning(message) {
    console.log(chalk.yellow(`⚠ ${message}`));
}
module.exports = {
    logSuccess,
    logError,
    logInfo,
    logWarning
};
//# sourceMappingURL=utils.js.map