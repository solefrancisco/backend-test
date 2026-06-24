const amqp = require('amqplib');
const { rabbitConfig } = require('@notify/configs/rabbitmq.config');

let connection = null;
let channel = null;

async function connectRabbit() {
    if (channel) 
        return channel;

    connection = await amqp.connect(rabbitConfig.url);

    connection.on('close', () => {
        channel = null;
        connection = null;
    });

    connection.on('error', () => {
        channel = null;
        connection = null;
    });

    channel = await connection.createChannel();

    if (rabbitConfig.notifierEnabled) {
        await channel.assertQueue(rabbitConfig.queues.email.default, { durable: true });
        await channel.assertQueue(rabbitConfig.queues.email.retry1, { 
            durable: true,
            messageTtl: 5000,
            deadLetterExchange: '',
            deadLetterRoutingKey: rabbitConfig.queues.email.default
         });
        await channel.assertQueue(rabbitConfig.queues.email.retry2, { 
            durable: true,
            messageTtl: 15000,
            deadLetterExchange: '',
            deadLetterRoutingKey: rabbitConfig.queues.email.default
         });
        await channel.assertQueue(rabbitConfig.queues.email.retry3, { 
            durable: true,
            messageTtl: 30000,
            deadLetterExchange: '',
            deadLetterRoutingKey: rabbitConfig.queues.email.default
         });
        await channel.assertQueue(rabbitConfig.queues.email.deadLetter, { durable: true });
        await channel.assertQueue(rabbitConfig.queues.webhook.default, { durable: true });
        await channel.assertQueue(rabbitConfig.queues.webhook.retry1, { 
            durable: true,
            messageTtl: 5000,
            deadLetterExchange: '',
            deadLetterRoutingKey: rabbitConfig.queues.webhook.default
         });
        await channel.assertQueue(rabbitConfig.queues.webhook.retry2, { 
            durable: true,
            messageTtl: 15000,
            deadLetterExchange: '',
            deadLetterRoutingKey: rabbitConfig.queues.webhook.default
         });
        await channel.assertQueue(rabbitConfig.queues.webhook.retry3, { 
            durable: true,
            messageTtl: 30000,
            deadLetterExchange: '',
            deadLetterRoutingKey: rabbitConfig.queues.webhook.default
         });
        await channel.assertQueue(rabbitConfig.queues.webhook.deadLetter, { durable: true });
    }

    return channel;
}


module.exports = {
    connectRabbit
};