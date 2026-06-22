// ─── Shared types used by both apps/api and apps/web ─────────────────────

export type ItemStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'in_transit';

export interface Item {
  _id?: string | { toString(): string };
  sku: string;
  name: string;
  description?: string;
  category: string;
  quantity: number;
  warehouseId: string;
  status: ItemStatus;
  price: number;
  tags: string[];
  totalValue?: number; // virtual
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// ─── Kafka event payloads ─────────────────────────────────────────────────
export type ItemEventType = 'ITEM_CREATED' | 'ITEM_UPDATED' | 'ITEM_DELETED';
export type AlertEventType = 'LOW_STOCK_ALERT' | 'OUT_OF_STOCK_ALERT' | 'ANOMALY_DETECTED';

export interface ItemKafkaEvent {
  event: ItemEventType;
  item?: Item;
  itemId?: string;
  timestamp: string;
}

export interface AlertKafkaEvent {
  event: AlertEventType;
  item?: Item;
  threshold?: number;
  timestamp: string;
}

// ─── Agent types ──────────────────────────────────────────────────────────
export interface AgentRunRequest {
  userMessage: string;
  systemPrompt?: string;
}

export interface AgentRunResponse {
  result: string;
  toolCalls: string[];
}
