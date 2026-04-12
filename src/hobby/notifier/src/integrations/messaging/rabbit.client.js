const amqp = require('amqplib');
const { env } = require('@notify/configs/env.config');

let connection = null;
let channel = null;

async function connectRabbit() {
    if (channel) 
        return channel;

    connection = await amqp.connect(env.rabbitMQURL);

    connection.on('close', () => {
        channel = null;
        connection = null;
    });

    connection.on('error', () => {
        channel = null;
        connection = null;
    });

    channel = await connection.createChannel();

    if (env.notifierEnabled) {
        await channel.assertQueue('notifications.email', { durable: true });
        await channel.assertQueue('notifications.webhook', { durable: true });
    }

    return channel;
}


module.exports = {
    connectRabbit
};