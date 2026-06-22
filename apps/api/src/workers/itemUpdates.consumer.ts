import { createConsumer, KAFKA_TOPICS } from '../config/kafka';
import { getSocketIO } from '../sockets';

/**
 * Consumes item.updates events and broadcasts them to connected WebSocket clients.
 * This is how the frontend gets live inventory updates without polling.
 */
export const startItemUpdatesConsumer = async (): Promise<void> => {
  const consumer = await createConsumer('beamup-item-updates');

  await consumer.subscribe({ topic: KAFKA_TOPICS.ITEM_UPDATES, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const payload = JSON.parse(message.value?.toString() ?? '{}');
        console.log(`[Kafka] ${topic}[${partition}] → ${payload.event}`);

        // Forward to Socket.io room so UI updates in real-time
        const io = getSocketIO();
        io.to('inventory').emit('inventory:update', payload);
      } catch (err) {
        console.error('[Kafka] Failed to process item.updates message:', err);
      }
    },
  });

  console.log(`✅ Kafka consumer listening on: ${KAFKA_TOPICS.ITEM_UPDATES}`);
};
