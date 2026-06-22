import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itemsApi, ItemFilters } from '../api/items';
import type { Item } from '@beamup/shared';

const QUERY_KEY = 'items';

export const useItems = (filters: ItemFilters = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, filters],
    queryFn: () => itemsApi.getAll(filters),
    staleTime: 30_000,
  });

export const useItem = (id: string) =>
  useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => itemsApi.getById(id),
    enabled: !!id,
  });

export const useCreateItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Item>) => itemsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};

export const useUpdateItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Item> }) =>
      itemsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};

export const useDeleteItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => itemsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};

export const useAdjustQuantity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, delta }: { id: string; delta: number }) =>
      itemsApi.adjustQuantity(id, delta),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};
