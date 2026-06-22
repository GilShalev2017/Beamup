import { Router } from 'express';
import { z } from 'zod';
import { itemsController } from '../controllers/items.controller';
import { validate } from '../middleware/validate';

const router = Router();

// ─── Validation schemas ────────────────────────────────────────────────────
const createItemSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  quantity: z.number().min(0).default(0),
  warehouseId: z.string().min(1, 'Warehouse ID is required'),
  price: z.number().min(0, 'Price must be non-negative'),
  tags: z.array(z.string()).optional().default([]),
});

const updateItemSchema = createItemSchema.partial();

const adjustQuantitySchema = z.object({
  delta: z.number().int('Delta must be an integer'),
});

// ─── Routes ────────────────────────────────────────────────────────────────
router.get('/',                           itemsController.getAll.bind(itemsController));
router.get('/:id',                        itemsController.getById.bind(itemsController));
router.post('/',    validate(createItemSchema),   itemsController.create.bind(itemsController));
router.put('/:id',  validate(updateItemSchema),   itemsController.update.bind(itemsController));
router.delete('/:id',                     itemsController.delete.bind(itemsController));
router.patch('/:id/quantity', validate(adjustQuantitySchema), itemsController.adjustQuantity.bind(itemsController));

export default router;
