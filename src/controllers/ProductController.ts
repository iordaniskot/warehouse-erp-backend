import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product } from '@/models/Product';
import { 
  createProductSchema, 
  updateProductSchema, 
  productQuerySchema,
  bulkUpdateStockSchema,
  ApiResponse 
} from '@/types/schemas';
import { logger } from '@/utils/logger';

export class ProductController {
  static async create(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const validation = createProductSchema.safeParse(req.body);
      
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        });
        return;
      }

      const productData = validation.data;

      // Check for duplicate SKU codes
      const skuCodes = productData.skus.map(sku => sku.skuCode).filter(Boolean);
      if (skuCodes.length > 0) {
        const existingProduct = await Product.findOne({
          'skus.skuCode': { $in: skuCodes }
        });
        
        if (existingProduct) {
          res.status(409).json({
            success: false,
            message: 'One or more SKU codes already exist'
          });
          return;
        }
      }

      const product = new Product(productData);
      await product.save();

      logger.info(`Product created: ${product.name} (${product._id})`);

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product
      });
    } catch (error) {
      logger.error('Product creation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create product'
      });
    }
  }

  static async list(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const validation = productQuerySchema.safeParse(req.query);
      
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: validation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        });
        return;
      }

      const { page, limit, sort, search, categoryId, brand, status, inStock } = validation.data;

      // Build filter query
      const filter: any = {};
      
      if (search) {
        filter.$text = { $search: search };
      }
      
      if (categoryId) {
        filter.categoryId = new mongoose.Types.ObjectId(categoryId);
      }
      
      if (brand) {
        filter.brand = new RegExp(brand, 'i');
      }
      
      if (status) {
        filter['skus.status'] = status;
      }
      
      if (inStock !== undefined) {
        if (inStock) {
          filter['skus.stockQty'] = { $gt: 0 };
        } else {
          filter['skus.stockQty'] = { $lte: 0 };
        }
      }

      // Build sort object
      const sortObj: any = {};
      if (sort.startsWith('-')) {
        sortObj[sort.substring(1)] = -1;
      } else {
        sortObj[sort] = 1;
      }

      const skip = (page - 1) * limit;

      const [products, total] = await Promise.all([
        Product.find(filter)
          .sort(sortObj)
          .skip(skip)
          .limit(limit)
          .populate('categoryId', 'name')
          .exec(),
        Product.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: products,
        meta: {
          total,
          page,
          limit,
          totalPages
        }
      });
    } catch (error) {
      logger.error('Product list error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch products'
      });
    }
  }

  static async getById(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid product ID'
        });
        return;
      }

      const product = await Product.findById(id).populate('categoryId', 'name');
      
      if (!product) {
        res.status(404).json({
          success: false,
          message: 'Product not found'
        });
        return;
      }

      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      logger.error('Product get error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch product'
      });
    }
  }

  static async getBySku(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { skuCode } = req.params;
      
      if (!skuCode) {
        res.status(400).json({
          success: false,
          message: 'SKU code is required'
        });
        return;
      }
      
      const product = await Product.findOne({
        'skus.skuCode': skuCode.toUpperCase()
      }).populate('categoryId', 'name');
      
      if (!product) {
        res.status(404).json({
          success: false,
          message: 'Product not found'
        });
        return;
      }

      const sku = product.skus.find(s => s.skuCode === skuCode.toUpperCase());
      
      res.json({
        success: true,
        data: {
          product,
          sku
        }
      });
    } catch (error) {
      logger.error('Product get by SKU error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch product'
      });
    }
  }

  static async update(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid product ID'
        });
        return;
      }

      const validation = updateProductSchema.safeParse(req.body);
      
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        });
        return;
      }

      const updateData = validation.data;

      // Check for duplicate SKU codes if SKUs are being updated
      if (updateData.skus) {
        const skuCodes = updateData.skus.map(sku => sku.skuCode).filter(Boolean);
        if (skuCodes.length > 0) {
          const existingProduct = await Product.findOne({
            _id: { $ne: id },
            'skus.skuCode': { $in: skuCodes }
          });
          
          if (existingProduct) {
            res.status(409).json({
              success: false,
              message: 'One or more SKU codes already exist'
            });
            return;
          }
        }
      }

      const product = await Product.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('categoryId', 'name');
      
      if (!product) {
        res.status(404).json({
          success: false,
          message: 'Product not found'
        });
        return;
      }

      logger.info(`Product updated: ${product.name} (${product._id})`);

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: product
      });
    } catch (error) {
      logger.error('Product update error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update product'
      });
    }
  }

  static async delete(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: 'Invalid product ID'
        });
        return;
      }

      const product = await Product.findByIdAndDelete(id);
      
      if (!product) {
        res.status(404).json({
          success: false,
          message: 'Product not found'
        });
        return;
      }

      logger.info(`Product deleted: ${product.name} (${product._id})`);

      res.json({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      logger.error('Product delete error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete product'
      });
    }
  }

  static async updateStock(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const validation = bulkUpdateStockSchema.safeParse(req.body);
      
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        });
        return;
      }

      const { updates } = validation.data;
      const results = [];

      // Process each update
      for (const update of updates) {
        try {
          const product = await Product.findOneAndUpdate(
            { 'skus.skuCode': update.skuCode },
            { $set: { 'skus.$.stockQty': update.newQty } },
            { new: true }
          );

          if (product) {
            results.push({
              skuCode: update.skuCode,
              success: true,
              newQty: update.newQty
            });
          } else {
            results.push({
              skuCode: update.skuCode,
              success: false,
              error: 'SKU not found'
            });
          }
        } catch (error) {
          results.push({
            skuCode: update.skuCode,
            success: false,
            error: 'Update failed'
          });
        }
      }

      logger.info(`Bulk stock update completed: ${results.filter(r => r.success).length}/${results.length} successful`);

      res.json({
        success: true,
        message: 'Bulk stock update completed',
        data: results
      });
    } catch (error) {
      logger.error('Bulk stock update error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update stock'
      });
    }
  }

  static async searchByBarcode(req: Request, res: Response<ApiResponse>): Promise<void> {
    try {
      const { barcode } = req.params;
      
      const product = await Product.findOne({
        'skus.barcode': barcode
      }).populate('categoryId', 'name');
      
      if (!product) {
        res.status(404).json({
          success: false,
          message: 'Product not found'
        });
        return;
      }

      const sku = product.skus.find(s => s.barcode === barcode);
      
      res.json({
        success: true,
        data: {
          product,
          sku
        }
      });
    } catch (error) {
      logger.error('Product search by barcode error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search product'
      });
    }
  }
}
