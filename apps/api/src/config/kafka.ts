import { Kafka, Producer, Consumer, logLevel } from 'kafkajs';

// ─── Topic constants (export and reuse everywhere) ─────────────────────────
export const KAFKA_TOPICS = {
  INVENTORY_EVENTS: 'inventory.events',
  AGENT_ACTIONS:    'agent.actions',
  ALERTS:           'supply-chain.alerts',
  ITEM_UPDATES:     'item.updates',
} as const;

export type KafkaTopic = (typeof KAFKA_TOPICS)[keyof typeof KAFKA_TOPICS];

// ─── Singleton Kafka instance ──────────────────────────────────────────────
let kafka: Kafka;
let producer: Producer;

export const getKafka = (): Kafka => {
  if (!kafka) {
    kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID || 'beamup-api',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      logLevel: logLevel.WARN,
      retry: { initialRetryTime: 300, retries: 8 },
    });
  }
  return kafka;
};

// ─── Producer ─────────────────────────────────────────────────────────────
export const getProducer = async (): Promise<Producer> => {
  if (!producer) {
    producer = getKafka().producer();
    await producer.connect();
    console.log('✅ Kafka producer connected');
  }
  return producer;
};

export const publishEvent = async (
  topic: KafkaTopic,
  payload: object,
  key?: string
): Promise<void> => {
  const p = await getProducer();
  await p.send({
    topic,
    messages: [
      {
        key: key ?? null,
        value: JSON.stringify({ ...payload, timestamp: new Date().toISOString() }),
      },
    ],
  });
};

// ─── Consumer factory ──────────────────────────────────────────────────────
export const createConsumer = async (groupId: string): Promise<Consumer> => {
  const consumer = getKafka().consumer({ groupId });
  await consumer.connect();
  return consumer;
};

// ─── Graceful shutdown ────────────────────────────────────────────────────
export const disconnectKafka = async (): Promise<void> => {
  if (producer) await producer.disconnect();
};
