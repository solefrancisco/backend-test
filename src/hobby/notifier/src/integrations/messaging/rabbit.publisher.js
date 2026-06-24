const { connectRabbit } = require('./rabbit.client');
const { rabbitConfig } = require('@notify/configs/rabbitmq.config');

async function publishToQueue(queue, payload) {
    const ch = await connectRabbit();

    const sent = ch.sendToQueue(
        queue,
        Buffer.from(JSON.stringify(payload)),
        {
            persistent: true,
            contentType: 'application/json',
            headers: {
                "retryCount": 0,
            }
        }
    );

    if (!sent) {
        throw new Error('RabbitMQ write buffer is full');
    }
}

module.exports = {
    publishToQueue,
};