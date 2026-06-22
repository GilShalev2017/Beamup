import { itemsRepository, ItemFilters, PaginationOptions } from '../repositories/items.repository';
import { IItem } from '../models/item.model';
import { publishEvent, KAFKA_TOPICS } from '../config/kafka';
import { getRedis } from '../config/redis';
import { AppError } from '../middleware/errorHandler';

const CACHE_TTL = 60; // seconds

// ─── Service layer — business logic, caching, events ─────────────────────
// Socket.IO broadcasts are handled exclusively by Kafka consumers,
// not here — avoids double-firing events.
export class ItemsService {
  private cacheKey = (id: string) => `item:${id}`;

  async getAll(filters: ItemFilters, pagination: PaginationOptions) {
    return itemsRepository.findAll(filters, pagination);
  }

  async getById(id: string): Promise<IItem> {
    const redis = getRedis();
    const cached = await redis.get(this.cacheKey(id));
    if (cached) return JSON.parse(cached) as IItem;

    const item = await itemsRepository.findById(id);
    if (!item) throw new AppError(`Item ${id} not found`, 404);

    await redis.setex(this.cacheKey(id), CACHE_TTL, JSON.stringify(item));
    return item;
  }

  async create(data: Partial<IItem>): Promise<IItem> {
    if (data.sku) {
      const existing = await itemsRepository.findBySku(data.sku);
      if (existing) throw new AppError(`SKU '${data.sku}' already exists`, 409);
    }

    const item = await itemsRepository.create(data);

    // Kafka → itemUpdates.consumer → Socket.IO (single path)
    await publishEvent(KAFKA_TOPICS.ITEM_UPDATES, { event: 'ITEM_CREATED', item }, item.id);

    return item;
  }

  async update(id: string, data: Partial<IItem>): Promise<IItem> {
    const item = await itemsRepository.update(id, data);
    if (!item) throw new AppError(`Item ${id} not found`, 404);

    await getRedis().del(this.cacheKey(id));

    await publishEvent(KAFKA_TOPICS.ITEM_UPDATES, { event: 'ITEM_UPDATED', item }, id);

    return item;
  }

  async delete(id: string): Promise<void> {
    const item = await itemsRepository.delete(id);
    if (!item) throw new AppError(`Item ${id} not found`, 404);

    await getRedis().del(this.cacheKey(id));

    await publishEvent(KAFKA_TOPICS.ITEM_UPDATES, { event: 'ITEM_DELETED', itemId: id }, id);
  }

  async adjustQuantity(id: string, delta: number): Promise<IItem> {
    const item = await itemsRepository.updateQuantity(id, delta);
    if (!item) throw new AppError(`Item ${id} not found`, 404);

    await getRedis().del(this.cacheKey(id));

    await publishEvent(KAFKA_TOPICS.ITEM_UPDATES, { event: 'ITEM_UPDATED', item }, id);

    // Low stock triggers a separate alert event
    if (item.status === 'low_stock' || item.status === 'out_of_stock') {
      await publishEvent(
        KAFKA_TOPICS.ALERTS,
        { event: 'LOW_STOCK_ALERT', item, threshold: 10 },
        id
      );
    }

    return item;
  }
}

export const itemsService = new ItemsService();
