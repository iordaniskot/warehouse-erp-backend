import { Router } from 'express';
import { WarehouseController } from '@/controllers/WarehouseController';
import { authenticate, requireRoles } from '@/middleware/auth';

const router = Router();

// All warehouse routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /warehouses:
 *   get:
 *     summary: Get warehouses list
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Warehouses retrieved successfully
 */
router.get('/', WarehouseController.list);

/**
 * @swagger
 * /warehouses:
 *   post:
 *     summary: Create a new warehouse
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *               - location
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               location:
 *                 type: object
 *     responses:
 *       201:
 *         description: Warehouse created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Warehouse code already exists
 */
router.post('/', requireRoles(['admin', 'manager']), WarehouseController.create);

/**
 * @swagger
 * /warehouses/{id}:
 *   get:
 *     summary: Get warehouse by ID
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Warehouse retrieved successfully
 *       404:
 *         description: Warehouse not found
 */
router.get('/:id', WarehouseController.getById);

/**
 * @swagger
 * /warehouses/{id}:
 *   put:
 *     summary: Update warehouse
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Warehouse updated successfully
 *       404:
 *         description: Warehouse not found
 */
router.put('/:id', requireRoles(['admin', 'manager']), WarehouseController.update);

/**
 * @swagger
 * /warehouses/{id}:
 *   delete:
 *     summary: Delete warehouse
 *     tags: [Warehouses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Warehouse deactivated successfully
 *       404:
 *         description: Warehouse not found
 */
router.delete('/:id', requireRoles(['admin', 'manager']), WarehouseController.delete);

export { router as warehouseRoutes };
