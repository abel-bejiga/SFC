const jsforce = require('jsforce');
const Configstore = require('configstore');

const config = new Configstore('SFC');

function getConnection() {
  if (!config.get('accessToken')) {
    throw new Error('Not authenticated. Please run "SFC authenticate" first.');
  }
  
  return new jsforce.Connection({
    instanceUrl: config.get('instanceUrl'),
    accessToken: config.get('accessToken')
  });
}

async function verifyConnection() {
  try {
    const conn = getConnection();
    await conn.identity();
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  getConnection,
  verifyConnection
};