import { createConsumer, KAFKA_TOPICS } from '../config/kafka';
import { getSocketIO } from '../sockets';

const EVENT_TO_SOCKET: Record<string, string> = {
  ITEM_CREATED: 'item:created',
  ITEM_UPDATED: 'item:updated',
  ITEM_DELETED: 'item:deleted',
};

/**
 * Single source of truth for broadcasting item changes to the frontend.
 * Service publishes to Kafka → this consumer → Socket.IO.
 * Nothing else emits these socket events.
 */
export const startItemUpdatesConsumer = async (): Promise<void> => {
  const consumer = await createConsumer('beamup-item-updates');

  await consumer.subscribe({ topic: KAFKA_TOPICS.ITEM_UPDATES, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const payload = JSON.parse(message.value?.toString() ?? '{}');
        console.log(`[Kafka] ${topic}[${partition}] → ${payload.event}`);

        const io = getSocketIO();
        const socketEvent = EVENT_TO_SOCKET[payload.event];

        if (socketEvent) {
          // Emit the typed event (item:created / item:updated / item:deleted)
          io.emit(socketEvent, payload.item ?? { id: payload.itemId });
        }
      } catch (err) {
        console.error('[Kafka] Failed to process item.updates message:', err);
      }
    },
  });

  console.log(`✅ Kafka consumer listening on: ${KAFKA_TOPICS.ITEM_UPDATES}`);
};
