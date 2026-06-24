const { env } = require('@notify/configs/env.config');

const queueBaseName = 'notifications';
const emailQueueBase = `${queueBaseName}.email`;
const emailRetryBase = `${emailQueueBase}.retry`;

const webhookQueueBase = `${queueBaseName}.webhook`;
const webhookRetryBase = `${webhookQueueBase}.retry`;

module.exports = {
  rabbitConfig: {
    enabled: env.rabbitMQEnabled,
    notifierEnabled: env.notifierEnabled,
    url: env.rabbitMQURL,
    maxRetries: env.rabbitMQMaxRetries,
    retryHeader: env.rabbitMQRetryHeader,
    queues: {
      email: {
        default: emailQueueBase,
        retry1: `${emailRetryBase}.1`,
        retry2: `${emailRetryBase}.2`,
        retry3: `${emailRetryBase}.3`,
        deadLetter: `${emailQueueBase}.deadletter`
      },
      webhook: {
        default: webhookQueueBase,
        retry1: `${webhookRetryBase}.1`,
        retry2: `${webhookRetryBase}.2`,
        retry3: `${webhookRetryBase}.3`,
        deadLetter: `${webhookQueueBase}.deadletter`
      }
    }
  }
};