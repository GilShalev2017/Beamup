import OpenAI from 'openai';
import { getOpenAI } from '../config/openai';
import { itemsRepository } from '../repositories/items.repository';
import { publishEvent, KAFKA_TOPICS } from '../config/kafka';
import { getSocketIO } from '../sockets';
import { Anomaly } from '../models/anomaly.model';
import prisma from '../config/postgres';

// ─── Tool definitions (OpenAI function-calling) ────────────────────────────
const AGENT_TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_inventory_status',
      description: 'Retrieve the current inventory status for a warehouse or a specific SKU',
      parameters: {
        type: 'object',
        properties: {
          warehouseId: { type: 'string', description: 'The warehouse identifier' },
          sku:         { type: 'string', description: 'Optional: filter to a specific SKU' },
        },
        required: ['warehouseId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'trigger_restock',
      description: 'Trigger a restock order for a given SKU. Publishes a restock event to the supply chain pipeline.',
      parameters: {
        type: 'object',
        properties: {
          sku:      { type: 'string', description: 'The SKU to restock' },
          quantity: { type: 'number', description: 'Number of units to order' },
          priority: { type: 'string', enum: ['low', 'normal', 'urgent'], description: 'Order priority' },
        },
        required: ['sku', 'quantity'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'flag_anomaly',
      description: 'Flag an inventory anomaly for human review. Persists to DB and alerts the ops team.',
      parameters: {
        type: 'object',
        properties: {
          itemId:      { type: 'string', description: 'The SKU of the item (e.g. SKU-003) or its MongoDB _id' },
          anomalyType: { type: 'string', enum: ['shrinkage', 'overstock', 'mismatch', 'damage'] },
          notes:       { type: 'string', description: 'Additional context for the ops team' },
        },
        required: ['itemId', 'anomalyType'],
      },
    },
  },
];

// ─── Real tool implementations ─────────────────────────────────────────────
const executeTool = async (name: string, args: Record<string, unknown>): Promise<string> => {
  switch (name) {

    case 'get_inventory_status': {
      const { warehouseId, sku } = args as { warehouseId: string; sku?: string };

      const { items, total } = await itemsRepository.findAll(
        { warehouseId, ...(sku ? { search: sku } : {}) },
        { limit: 50 }
      );

      const summary = {
        warehouseId,
        totalItems: total,
        lowStock:    items.filter(i => i.status === 'low_stock').map(i => ({ sku: i.sku, name: i.name, quantity: i.quantity })),
        outOfStock:  items.filter(i => i.status === 'out_of_stock').map(i => ({ sku: i.sku, name: i.name })),
        inStock:     items.filter(i => i.status === 'in_stock').length,
        inTransit:   items.filter(i => i.status === 'in_transit').length,
      };

      return JSON.stringify(summary);
    }

    case 'trigger_restock': {
      const { sku, quantity, priority = 'normal' } = args as { sku: string; quantity: number; priority?: string };

      // Find item to get warehouseId
      const item = await itemsRepository.findBySku(sku);

      // Persist restock order to PostgreSQL
      const order = await prisma.order.create({
        data: {
          sku,
          quantity,
          priority,
          warehouseId: item?.warehouseId ?? 'UNKNOWN',
          triggeredBy: 'agent',
          status:      'PENDING',
          notes:       `Auto-triggered by AI agent`,
        },
      });

      // Publish to Kafka pipeline
      await publishEvent(
        KAFKA_TOPICS.AGENT_ACTIONS,
        { event: 'RESTOCK_TRIGGERED', orderId: order.id, sku, quantity, priority },
        sku
      );

      // Notify ops team via Socket.IO
      const io = getSocketIO();
      io.emit('alert', {
        event:   'RESTOCK_TRIGGERED',
        message: `Agent triggered restock: ${quantity} units of ${sku} (${priority} priority)`,
        orderId: order.id,
      });

      return JSON.stringify({ success: true, orderId: order.id, sku, quantity, priority });
    }

    case 'flag_anomaly': {
      const { itemId, anomalyType, notes } = args as { itemId: string; anomalyType: string; notes?: string };

      // OpenAI may pass either a SKU or a MongoDB ObjectId — handle both
      const mongoose = await import('mongoose');
      const item = mongoose.default.isValidObjectId(itemId)
        ? await itemsRepository.findById(itemId)
        : await itemsRepository.findBySku(itemId);

      // Persist anomaly to MongoDB using the real _id
      const resolvedItemId = item?._id?.toString() ?? itemId;
      const anomaly = await Anomaly.create({
        itemId:      resolvedItemId,
        itemName:    item?.name ?? 'Unknown',
        anomalyType,
        notes:       notes ?? '',
        flaggedByAgent: true,
      });

      // Alert the ops team via Socket.IO
      const io = getSocketIO();
      io.emit('alert', {
        event:      'ANOMALY_FLAGGED',
        anomalyType,
        itemId:     resolvedItemId,
        itemName:   item?.name,
        ticketId:   anomaly.id,
        notes,
      });

      return JSON.stringify({
        flagged:    true,
        ticketId:   anomaly.id,
        itemId:     resolvedItemId,
        anomalyType,
      });
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
};

// ─── Agent runner — agentic loop with tool calling ─────────────────────────
export interface AgentRunOptions {
  systemPrompt?: string;
  userMessage: string;
  maxIterations?: number;
}

export const runAgent = async ({
  systemPrompt = `You are Beamup's supply chain AI agent.
You monitor inventory health, detect issues, and execute corrective actions autonomously.
When you detect a problem, use the available tools to investigate and resolve it.
Be concise and action-oriented.`,
  userMessage,
  maxIterations = 5,
}: AgentRunOptions): Promise<{ result: string; toolCalls: string[] }> => {
  const openai = getOpenAI();
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user',   content: userMessage },
  ];
  const toolCalls: string[] = [];

  for (let i = 0; i < maxIterations; i++) {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      tools: AGENT_TOOLS,
      tool_choice: 'auto',
    });

    const choice = response.choices[0];
    messages.push(choice.message);

    // No tool calls → agent is done
    if (!choice.message.tool_calls || choice.message.tool_calls.length === 0) {
      return { result: choice.message.content ?? '', toolCalls };
    }

    // Execute each requested tool and feed results back
    for (const call of choice.message.tool_calls) {
      const args = JSON.parse(call.function.arguments);
      const toolResult = await executeTool(call.function.name, args);
      toolCalls.push(`${call.function.name}(${JSON.stringify(args)})`);

      messages.push({
        role:         'tool',
        tool_call_id: call.id,
        content:      toolResult,
      });
    }
  }

  return { result: 'Max iterations reached.', toolCalls };
};
