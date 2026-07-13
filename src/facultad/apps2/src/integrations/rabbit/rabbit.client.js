const { rabbitConfig } = require('@apps2/configs/rabbitmq.config');

let connection = null;
let channel = null;

async function connectRabbit() {
    if (channel) {
        return channel;
    }

    if (!rabbitConfig.url) {
        throw new Error('Missing RabbitMQ connection settings. Set APPS2_RABBITMQ_URL or APPS2_RABBITMQ_USER/APPS2_RABBITMQ_PASSWORD. RABBITMQ_* aliases are also supported.');
    }

    const amqp = require('amqplib');
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
    return channel;
}

module.exports = { connectRabbit };
