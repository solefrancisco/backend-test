const { connectRabbit } = require('./rabbit.client');

async function publishToQueue(queue, payload) {
    const ch = await connectRabbit();

    const sent = ch.sendToQueue(
        queue,
        Buffer.from(JSON.stringify(payload)),
        { persistent: true }
    );

    if (!sent) {
        throw new Error('RabbitMQ write buffer is full');
    }
}

module.exports = {
    publishToQueue,
};