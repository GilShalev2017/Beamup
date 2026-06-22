import { FilterQuery } from 'mongoose';
import { Item, IItem } from '../models/item.model';

export interface ItemFilters {
  category?: string;
  status?: string;
  warehouseId?: string;
  search?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

// ─── Repository layer — all direct DB access lives here ───────────────────
export class ItemsRepository {
  async findAll(filters: ItemFilters = {}, pagination: PaginationOptions = {}) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const query: FilterQuery<IItem> = {};
    if (filters.category) query.category = filters.category;
    if (filters.status) query.status = filters.status;
    if (filters.warehouseId) query.warehouseId = filters.warehouseId;
    if (filters.search) query.$text = { $search: filters.search };

    const [items, total] = await Promise.all([
      Item.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Item.countDocuments(query),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findById(id: string): Promise<IItem | null> {
    return Item.findById(id);
  }

  async findBySku(sku: string): Promise<IItem | null> {
    return Item.findOne({ sku: sku.toUpperCase() });
  }

  async create(data: Partial<IItem>): Promise<IItem> {
    const item = new Item(data);
    return item.save();
  }

  async update(id: string, data: Partial<IItem>): Promise<IItem | null> {
    return Item.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  }

  async delete(id: string): Promise<IItem | null> {
    return Item.findByIdAndDelete(id);
  }

  async updateQuantity(id: string, delta: number): Promise<IItem | null> {
    return Item.findByIdAndUpdate(
      id,
      { $inc: { quantity: delta } },
      { new: true, runValidators: true }
    );
  }
}

export const itemsRepository = new ItemsRepository();
