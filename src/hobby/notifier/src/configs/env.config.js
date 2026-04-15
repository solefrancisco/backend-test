const dotenv = require('dotenv');

dotenv.config();

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
  env: {
    // APP
    port: Number(process.env.PORT),

    // DATABASE
    dbEnabled: getBoolean('NOTIFIER_DB_ENABLED'),
    dbHost: getRequired('NOTIFIER_DB_HOST'),
    dbPort: Number(process.env.NOTIFIER_DB_PORT),
    dbUser: getRequired('NOTIFIER_DB_USER'),
    dbPassword: getRequired('NOTIFIER_DB_PASSWORD'),
    dbName: getRequired('NOTIFIER_DB_NAME'),
    dbConnectionLimit: Number(process.env.NOTIFIER_DB_CONNECTION_LIMIT),
    dbQueueLimit: Number(process.env.NOTIFIER_DB_QUEUE_LIMIT),
    dbWaitForConnections: getBoolean('NOTIFIER_DB_WAIT_FOR_CONNECTIONS'),
    
    // PAGINATION
    paginationDefaultPageSize: getRequired('NOTIFIER_PAGINATION_DEFAULT_PAGE_SIZE'),

    // MODULES
    notifierEnabled: getBoolean('NOTIFIER_NOTIFY_ENABLED'),
    apps2_environmentUrl: getRequired('APPS2_ENVIRONMENT_URL'),

    // RABBITMQ
    rabbitMQEnabled: getBoolean('NOTIFIER_RABBITMQ_ENABLED'),
    rabbitMQURL: getRequired('NOTIFIER_RABBITMQ_URL'),
    rabbitMQMaxRetries: Number(process.env.NOTIFIER_RABBITMQ_MAX_RETRIES),
    rabbitMQRetryHeader: getRequired('NOTIFIER_RABBITMQ_RETRY_HEADER'),

    // SMTP EMAIL
    smtpHost: getRequired('NOTIFIER_SMTP_HOST'),
    smtpPort: Number(process.env.NOTIFIER_SMTP_PORT),
    smtpSecure: getBoolean('NOTIFIER_SMTP_SECURE'),
    smtpBaseDomain: getRequired('NOTIFIER_SMTP_BASE_DOMAIN'),
    smtpUser: getRequired('NOTIFIER_SMTP_USER'),
    smtpPass: getRequired('NOTIFIER_SMTP_PASS'),

    // HMAC
    apiKeyHmacSecret: getRequired('NOTIFIER_API_KEY_HMAC_SECRET')
  }
};