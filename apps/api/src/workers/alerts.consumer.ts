import { createConsumer, KAFKA_TOPICS } from '../config/kafka';
import { getSocketIO } from '../sockets';

/**
 * Consumes supply-chain.alerts events.
 * In production you'd also send emails / PagerDuty / Slack here.
 */
export const startAlertsConsumer = async (): Promise<void> => {
  const consumer = await createConsumer('beamup-alerts');

  await consumer.subscribe({ topic: KAFKA_TOPICS.ALERTS, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const payload = JSON.parse(message.value?.toString() ?? '{}');
        console.warn(`[Alert] ${payload.event}`, payload);

        // Push alert to all connected clients
        const io = getSocketIO();
        io.emit('alert', payload);

        // TODO: integrate with notification service (email, Slack, PagerDuty)
      } catch (err) {
        console.error('[Kafka] Failed to process alert message:', err);
      }
    },
  });

  console.log(`✅ Kafka consumer listening on: ${KAFKA_TOPICS.ALERTS}`);
};
