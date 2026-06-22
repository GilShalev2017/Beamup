/**
 * Test/simulation endpoints — remove or gate behind NODE_ENV check in production.
 */
import { Router, Request, Response, NextFunction } from 'express';
import { publishEvent, KAFKA_TOPICS } from '../config/kafka';
import { getSocketIO } from '../sockets'; // used by /test/socket

const router = Router();

/**
 * POST /api/test/alert
 * Simulate a supply-chain alert without touching inventory.
 *
 * Body (all optional):
 * {
 *   "event":   "LOW_STOCK_ALERT" | "OUT_OF_STOCK_ALERT" | "ANOMALY_DETECTED",
 *   "itemName": "Industrial Sensor A",
 *   "message":  "Custom message"
 * }
 */
router.post('/alert', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event    = req.body.event    ?? 'LOW_STOCK_ALERT';
    const itemName = req.body.itemName ?? 'Simulated Item';
    const message  = req.body.message  ?? `Simulated ${event} for ${itemName}`;

    const payload = {
      event,
      item:    { name: itemName, sku: 'SIM-001', quantity: 3 },
      message,
      simulated: true,
    };

    // Kafka only — alerts.consumer will broadcast to Socket.IO
    await publishEvent(KAFKA_TOPICS.ALERTS, payload);

    res.json({ success: true, message: `Alert "${event}" published`, payload });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/test/socket
 * Fire any arbitrary socket event to all connected clients.
 * Useful for testing LiveFeed without touching real data.
 *
 * Body: { "event": "item:updated", "payload": { ... } }
 */
router.post('/socket', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { event = 'test:event', payload = {} } = req.body;
    const io = getSocketIO();
    io.emit(event, { ...payload, _simulated: true, timestamp: new Date().toISOString() });
    res.json({ success: true, message: `Socket event "${event}" emitted` });
  } catch (err) {
    next(err);
  }
});

export default router;
