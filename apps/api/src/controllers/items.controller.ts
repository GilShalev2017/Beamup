import { Request, Response, NextFunction } from 'express';
import { itemsService } from '../services/items.service';

// ─── Controller — thin layer, just HTTP in/out ────────────────────────────
export class ItemsController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category, status, warehouseId, search, page, limit } = req.query;

      const result = await itemsService.getAll(
        {
          category: category as string,
          status: status as string,
          warehouseId: warehouseId as string,
          search: search as string,
        },
        {
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 20,
        }
      );

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await itemsService.getById(req.params.id);
      res.json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await itemsService.create(req.body);
      res.status(201).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await itemsService.update(req.params.id, req.body);
      res.json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await itemsService.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  async adjustQuantity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { delta } = req.body;
      const item = await itemsService.adjustQuantity(req.params.id, delta);
      res.json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }
}

export const itemsController = new ItemsController();
