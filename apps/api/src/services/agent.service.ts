import OpenAI from 'openai';
import { getOpenAI } from '../config/openai';

// ─── Tool definitions (OpenAI function-calling) ────────────────────────────
const AGENT_TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_inventory_status',
      description: 'Retrieve the current inventory status for a warehouse or SKU',
      parameters: {
        type: 'object',
        properties: {
          warehouseId: { type: 'string', description: 'The warehouse identifier' },
          sku:         { type: 'string', description: 'Optional specific SKU to check' },
        },
        required: ['warehouseId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'trigger_restock',
      description: 'Trigger a restock order for a given item',
      parameters: {
        type: 'object',
        properties: {
          sku:      { type: 'string' },
          quantity: { type: 'number', description: 'Units to restock' },
          priority: { type: 'string', enum: ['low', 'normal', 'urgent'] },
        },
        required: ['sku', 'quantity'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'flag_anomaly',
      description: 'Flag an inventory anomaly for human review',
      parameters: {
        type: 'object',
        properties: {
          itemId:      { type: 'string' },
          anomalyType: { type: 'string', enum: ['shrinkage', 'overstock', 'mismatch', 'damage'] },
          notes:       { type: 'string' },
        },
        required: ['itemId', 'anomalyType'],
      },
    },
  },
];

// ─── Tool execution (stub — wire to real services) ─────────────────────────
const executeTool = async (name: string, args: Record<string, unknown>): Promise<string> => {
  switch (name) {
    case 'get_inventory_status':
      // TODO: call itemsRepository.findAll({ warehouseId: args.warehouseId })
      return JSON.stringify({ warehouseId: args.warehouseId, status: 'ok', items: 42 });

    case 'trigger_restock':
      // TODO: publish to Kafka RESTOCK topic
      return JSON.stringify({ success: true, orderId: `PO-${Date.now()}`, sku: args.sku });

    case 'flag_anomaly':
      // TODO: persist to DB and alert operations team
      return JSON.stringify({ flagged: true, ticketId: `ANO-${Date.now()}` });

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

    // Execute each requested tool
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
