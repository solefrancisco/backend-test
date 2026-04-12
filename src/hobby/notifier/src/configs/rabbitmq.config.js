const { env } = require('@notify/configs/env.config');

module.exports = {
  rabbitConfig: {
    enabled: env.rabbitMQEnabled,
    url: env.rabbitMQURL,
    maxRetries: env.rabbitMQMaxRetries,
    retryHeader: env.rabbitMQRetryHeader,
    queues: {
      email: 'notifications.email',
      webhook: 'notifications.webhook'
    }
  }
};