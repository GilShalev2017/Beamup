import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { runAgent } from '../services/agent.service';

const router = Router();

const runSchema = z.object({
  userMessage:  z.string().min(1, 'userMessage is required'),
  systemPrompt: z.string().optional(),
});

/**
 * POST /api/agent/run
 * Runs the AI agent agentic loop with optional tool calling.
 *
 * Example body:
 * { "userMessage": "Check inventory at WH-NY-01 and restock anything below 10 units" }
 */
router.post('/run', validate(runSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userMessage, systemPrompt } = req.body;
    console.log('Received request to run agent with userMessage:', userMessage, 'and systemPrompt:', systemPrompt);
    const result = await runAgent({ userMessage, systemPrompt });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
