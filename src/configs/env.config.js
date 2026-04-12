require('dotenv').config();

function getRequired(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  
  return value;
}

function getBoolean(name) {
  const rawValue = process.env[name];

  if (rawValue == null) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  const normalizedValue = rawValue.trim().toLowerCase();

  // required since when using Boolean() on a non-empty string it will always return true, even for "false"
  if (normalizedValue === 'true') {
    return true;
  }

  if (normalizedValue === 'false') {
    return false;
  }

  throw new Error(`Environment variable ${name} must be "true" or "false"`);
}

module.exports = {   
    port: Number(getRequired('PORT')),
    apps2Enabled: getBoolean('APPS2_ENABLED'),
    notifierEnabled: getBoolean('NOTIFIER_ENABLED'),
    portfolioEnabled: getBoolean('PORTFOLIO_ENABLED') 
};