import { apiClient } from './client';
import type { Item, PaginatedResponse } from '@beamup/shared';

export interface ItemFilters {
  category?: string;
  status?: string;
  warehouseId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const itemsApi = {
  getAll: async (filters: ItemFilters = {}): Promise<PaginatedResponse<Item>> => {
    const { data } = await apiClient.get('/items', { params: filters });
    return data.data;
  },

  getById: async (id: string): Promise<Item> => {
    const { data } = await apiClient.get(`/items/${id}`);
    return data.data;
  },

  create: async (payload: Partial<Item>): Promise<Item> => {
    const { data } = await apiClient.post('/items', payload);
    return data.data;
  },

  update: async (id: string, payload: Partial<Item>): Promise<Item> => {
    const { data } = await apiClient.put(`/items/${id}`, payload);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/items/${id}`);
  },

  adjustQuantity: async (id: string, delta: number): Promise<Item> => {
    const { data } = await apiClient.patch(`/items/${id}/quantity`, { delta });
    return data.data;
  },
};
