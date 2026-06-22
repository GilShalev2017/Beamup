import { Router } from 'express';
import itemsRouter from './items.route';
import authRouter  from './auth.route';
import agentRouter from './agent.route';
import testRouter  from './test.route';

const router = Router();

router.use('/auth',  authRouter);
router.use('/items', itemsRouter);
router.use('/agent', agentRouter);

// Simulation helpers — only mount in non-production
if (process.env.NODE_ENV !== 'production') {
  router.use('/test', testRouter);
}

export default router;
