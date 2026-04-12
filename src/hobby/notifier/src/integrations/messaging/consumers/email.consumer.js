const { rabbitConfig } = require('@notify/configs/rabbitmq.config');
const { connectRabbit } = require('@notify/integrations/messaging/rabbit.client');
const { createEmailTransporter } = require('@notify/integrations/email/email.client');
const { renderEmailTemplate } = require('@notify/templates/email');

async function processEmailNotification(data, transporter, emailAccount) {
    const template = renderEmailTemplate(data);

    await transporter.sendMail({
        from: emailAccount.from,
        to: data.to,
        subject: template.subject,
        html: template.html,
        text: template.text,
    });
}

function getRetryCount(message) {
    return Number(message.properties?.headers?.[rabbitConfig.retryHeader] ?? 0);
}

async function requeueMessage(channel, message, nextRetryCount) {
    const sent = channel.sendToQueue(
        rabbitConfig.queues.email,
        message.content,
        {
            persistent: true,
            contentType: message.properties.contentType || 'application/json',
            headers: {
                ...(message.properties.headers || {}),
                [rabbitConfig.retryHeader]: nextRetryCount,
            },
        }
    );

    if (!sent) {
        throw new Error('RabbitMQ write buffer is full while requeueing email notification');
    }
}

async function startEmailConsumer() {
    const channel = await connectRabbit();

    await channel.assertQueue(rabbitConfig.queues.email, { durable: true });
    channel.prefetch(1);

    channel.consume(rabbitConfig.queues.email, async (message) => {
        if (!message) {
            return;
        }

        const retryCount = getRetryCount(message);

        try {
            const rawContent = message.content.toString();
            const data = JSON.parse(rawContent);
            const { transporter, emailAccount } = createEmailTransporter(data.notificationType);

            await processEmailNotification(data, transporter, emailAccount);
            channel.ack(message);
        } catch (error) {
            const nextRetryCount = retryCount + 1;

            try {
                if (nextRetryCount <= rabbitConfig.maxRetries) {
                    await requeueMessage(channel, message, nextRetryCount);
                    channel.ack(message);
                } else {
                    channel.nack(message, false, false);
                }
            } catch (requeueError) {
                channel.nack(message, false, false);
            }
        }
    });
}

module.exports = {
  startEmailConsumer,
  processEmailNotification,
};