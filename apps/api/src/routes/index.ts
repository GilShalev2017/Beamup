import { Router } from 'express';
import itemsRouter from './items.route';
import authRouter from './auth.route';
// import agentRouter from './agent.route'; // add when needed

const router = Router();

router.use('/auth', authRouter);
router.use('/items', itemsRouter);
// router.use('/agent', agentRouter);

export default router;
