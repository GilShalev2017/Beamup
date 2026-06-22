import { itemsRepository, ItemFilters, PaginationOptions } from '../repositories/items.repository';
import { IItem } from '../models/item.model';
import { publishEvent, KAFKA_TOPICS } from '../config/kafka';
import { getRedis } from '../config/redis';
import { AppError } from '../middleware/errorHandler';
import { getSocketIO } from '../sockets';

const CACHE_TTL = 60; // seconds

// ─── Service layer — business logic, caching, events ─────────────────────
export class ItemsService {
  private cacheKey = (id: string) => `item:${id}`;

  async getAll(filters: ItemFilters, pagination: PaginationOptions) {
    return itemsRepository.findAll(filters, pagination);
  }

  async getById(id: string): Promise<IItem> {
    // Check Redis cache first
    const redis = getRedis();
    const cached = await redis.get(this.cacheKey(id));
    if (cached) return JSON.parse(cached) as IItem;

    const item = await itemsRepository.findById(id);
    if (!item) throw new AppError(`Item ${id} not found`, 404);

    // Cache for future reads
    await redis.setex(this.cacheKey(id), CACHE_TTL, JSON.stringify(item));
    return item;
  }

  async create(data: Partial<IItem>): Promise<IItem> {
    // Check SKU uniqueness
    if (data.sku) {
      const existing = await itemsRepository.findBySku(data.sku);
      if (existing) throw new AppError(`SKU '${data.sku}' already exists`, 409);
    }

    const item = await itemsRepository.create(data);

    // Publish Kafka event
    await publishEvent(KAFKA_TOPICS.ITEM_UPDATES, { event: 'ITEM_CREATED', item }, item.id);

    // Broadcast via Socket.io to all connected clients
    const io = getSocketIO();
    io.emit('item:created', item);

    return item;
  }

  async update(id: string, data: Partial<IItem>): Promise<IItem> {
    const item = await itemsRepository.update(id, data);
    if (!item) throw new AppError(`Item ${id} not found`, 404);

    // Invalidate cache
    await getRedis().del(this.cacheKey(id));

    // Publish Kafka event
    await publishEvent(KAFKA_TOPICS.ITEM_UPDATES, { event: 'ITEM_UPDATED', item }, id);

    // Broadcast via Socket.io
    const io = getSocketIO();
    io.emit('item:updated', item);

    return item;
  }

  async delete(id: string): Promise<void> {
    const item = await itemsRepository.delete(id);
    if (!item) throw new AppError(`Item ${id} not found`, 404);

    // Invalidate cache
    await getRedis().del(this.cacheKey(id));

    // Publish Kafka event
    await publishEvent(KAFKA_TOPICS.ITEM_UPDATES, { event: 'ITEM_DELETED', itemId: id }, id);

    // Broadcast via Socket.io
    const io = getSocketIO();
    io.emit('item:deleted', { id });
  }

  async adjustQuantity(id: string, delta: number): Promise<IItem> {
    const item = await itemsRepository.updateQuantity(id, delta);
    if (!item) throw new AppError(`Item ${id} not found`, 404);

    await getRedis().del(this.cacheKey(id));

    // If stock is low, publish an alert
    if (item.status === 'low_stock' || item.status === 'out_of_stock') {
      await publishEvent(
        KAFKA_TOPICS.ALERTS,
        { event: 'LOW_STOCK_ALERT', item, threshold: 10 },
        id
      );
    }

    const io = getSocketIO();
    io.emit('item:updated', item);

    return item;
  }
}

export const itemsService = new ItemsService();
