import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Warehouse } from '@/models/Warehouse';
import { createWarehouseSchema, updateWarehouseSchema, ApiResponse } from '@/types/schemas';
import { logger } from '@/utils/logger';

export class WarehouseController {
  static async create(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const validation = createWarehouseSchema.safeParse(req.body);
      
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        });
        return;
      }

      const warehouseData = validation.data;

      // Check if warehouse code already exists
      const existingWarehouse = await Warehouse.findOne({ code: warehouseData.code });
      if (existingWarehouse) {
        res.status(409).json({
          success: false,
          message: 'Warehouse code already exists'
        });
        return;
      }

      const warehouse = new Warehouse(warehouseData);
      await warehouse.save();

      logger.info(`Warehouse created: ${warehouse.name} (${warehouse.code})`);

      res.status(201).json({
        success: true,
        message: 'Warehouse created successfully',
        data: warehouse
      });
    } catch (error) {
      logger.error('Warehouse creation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create warehouse'
      });
    }
  }

  static async list(_req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const warehouses = await Warehouse.find({ isActive: true }).sort({ name: 1 });

      res.json({
        success: true,
        data: warehouses
      });
    } catch (error) {
      logger.error('Warehouse list error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch warehouses'
      });
    }
  }

  static async getById(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid warehouse ID'
        });
        return;
      }

      const warehouse = await Warehouse.findById(id);
      
      if (!warehouse) {
        res.status(404).json({
          success: false,
          message: 'Warehouse not found'
        });
        return;
      }

      res.json({
        success: true,
        data: warehouse
      });
    } catch (error) {
      logger.error('Warehouse get error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch warehouse'
      });
    }
  }

  static async update(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid warehouse ID'
        });
        return;
      }

      const validation = updateWarehouseSchema.safeParse(req.body);
      
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        });
        return;
      }

      const updateData = validation.data;

      // Check if warehouse code is being updated and already exists
      if (updateData.code) {
        const existingWarehouse = await Warehouse.findOne({
          _id: { $ne: id },
          code: updateData.code
        });
        
        if (existingWarehouse) {
          res.status(409).json({
            success: false,
            message: 'Warehouse code already exists'
          });
          return;
        }
      }

      const warehouse = await Warehouse.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
      
      if (!warehouse) {
        res.status(404).json({
          success: false,
          message: 'Warehouse not found'
        });
        return;
      }

      logger.info(`Warehouse updated: ${warehouse.name} (${warehouse.code})`);

      res.json({
        success: true,
        message: 'Warehouse updated successfully',
        data: warehouse
      });
    } catch (error) {
      logger.error('Warehouse update error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update warehouse'
      });
    }
  }

  static async delete(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid warehouse ID'
        });
        return;
      }

      // Soft delete by setting isActive to false
      const warehouse = await Warehouse.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      );
      
      if (!warehouse) {
        res.status(404).json({
          success: false,
          message: 'Warehouse not found'
        });
        return;
      }

      logger.info(`Warehouse deactivated: ${warehouse.name} (${warehouse.code})`);

      res.json({
        success: true,
        message: 'Warehouse deactivated successfully'
      });
    } catch (error) {
      logger.error('Warehouse delete error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to deactivate warehouse'
      });
    }
  }
}
