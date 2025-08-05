# Warehouse ERP Backend

Unified Retail & Wholesale Warehouse Management System API built with Express.js, TypeScript, and MongoDB.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Product Management**: Full CRUD operations for products and variants
- **Inventory Management**: Stock movements, multi-warehouse support
- **Order Processing**: POS and wholesale order handling
- **Reporting**: Stock reports, sales analytics, movement tracking
- **API Documentation**: Auto-generated Swagger/OpenAPI docs
- **Security**: Rate limiting, CORS, helmet protection
- **Monitoring**: Winston logging, error handling

## Tech Stack

- **Runtime**: Node.js 20 LTS
- **Framework**: Express 5 with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Cache/Queue**: Redis
- **Authentication**: JWT (access + refresh tokens)
- **Validation**: Zod schemas
- **Documentation**: Swagger/OpenAPI 3.1
- **Testing**: Jest with ts-jest
- **Linting**: ESLint + Prettier

## Project Structure

```
src/
├── config/          # Configuration files
│   ├── database.ts   # MongoDB connection
│   ├── environment.ts # Environment variables
│   └── redis.ts      # Redis connection
├── controllers/      # Request handlers
├── middleware/       # Express middleware
│   ├── error-handler.ts
│   └── request-logger.ts
├── models/          # Mongoose schemas
├── routes/          # API routes
│   ├── auth.routes.ts
│   ├── product.routes.ts
│   ├── order.routes.ts
│   ├── movement.routes.ts
│   ├── warehouse.routes.ts
│   └── report.routes.ts
├── services/        # Business logic
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
│   └── logger.ts
└── index.ts         # Application entry point
```

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- MongoDB (local or Atlas)
- Redis (local or cloud)
- npm or yarn

### Installation

1. **Clone and navigate to the project:**
   ```bash
   cd warehouse-erp-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB and Redis:**
   ```bash
   # MongoDB (if using local instance)
   mongod
   
   # Redis (if using local instance)
   redis-server
   ```

### Development

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **The server will start on http://localhost:3001**

3. **API Documentation available at:**
   - Swagger UI: http://localhost:3001/docs
   - Health Check: http://localhost:3001/health

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the TypeScript project
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run type-check` - TypeScript type checking

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `3001` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/warehouse-erp` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_ACCESS_SECRET` | JWT access token secret | (change in production) |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | (change in production) |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |

See `.env.example` for complete list.

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration  
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout

### Products
- `GET /api/v1/products` - List products
- `GET /api/v1/products/:id` - Get product by ID
- `POST /api/v1/products` - Create product
- `PUT /api/v1/products/:id` - Update product
- `DELETE /api/v1/products/:id` - Delete product

### Orders
- `GET /api/v1/orders` - List orders
- `GET /api/v1/orders/:id` - Get order by ID
- `POST /api/v1/orders` - Create order
- `PATCH /api/v1/orders/:id/status` - Update order status

### Stock Movements
- `GET /api/v1/movements` - List stock movements
- `POST /api/v1/movements` - Create stock movement
- `POST /api/v1/movements/batch` - Batch create movements

### Warehouses
- `GET /api/v1/warehouses` - List warehouses
- `GET /api/v1/warehouses/:id` - Get warehouse by ID
- `POST /api/v1/warehouses` - Create warehouse
- `PUT /api/v1/warehouses/:id` - Update warehouse
- `DELETE /api/v1/warehouses/:id` - Delete warehouse

### Reports
- `GET /api/v1/reports/stock-on-hand` - Stock on hand report
- `GET /api/v1/reports/sales` - Sales report
- `GET /api/v1/reports/stock-movements` - Stock movements report
- `GET /api/v1/reports/low-stock` - Low stock report

## Data Models

Based on the PRD specifications:

### Products Collection
```typescript
{
  _id: ObjectId,
  name: string,
  description: string,
  categoryId: ObjectId,
  brand: string,
  skus: [{
    skuCode: string,     // unique
    barcode: string,     // EAN/UPC/QR
    attributes: {        // size, color, etc.
      size?: string,
      color?: string,
      material?: string
    },
    cost: number,
    priceList: {
      retail: number,
      wholesaleTier1: number,
      wholesaleTier2: number
    },
    stockQty: number,
    status: 'ACTIVE' | 'ARCHIVED',
    vendors: [{
      vendorId: ObjectId,
      name: string,
      vendorSKU: string,
      leadTimeDays: number,
      lastCost: number,
      preferred: boolean,
      contactInfo: {
        email: string,
        phone: string
      }
    }]
  }]
}
```

### Orders Collection
```typescript
{
  _id: ObjectId,
  customerId: ObjectId,
  lines: [{
    skuCode: string,
    qty: number,
    price: number
  }],
  status: 'pending' | 'processing' | 'completed' | 'cancelled',
  totals: {
    subtotal: number,
    tax: number,
    total: number
  },
  channel: 'POS' | 'B2B',
  createdAt: Date,
  updatedAt: Date
}
```

## Security

- JWT tokens with RS256 signing
- BCrypt password hashing (12 salt rounds)
- Rate limiting (100 requests/minute per IP)
- CORS protection
- Helmet security headers
- Input validation with Zod schemas

## Testing

The project uses Jest for testing with ts-jest preset:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

Coverage threshold is set to 80% for branches, functions, lines, and statements.

## Deployment

### Production Build

```bash
npm run build
npm start
```

### Docker Support

The project is ready for containerization. MongoDB and Redis connections are configurable via environment variables.

### Health Monitoring

- Health check endpoint: `GET /health`
- Winston logging with configurable levels
- Structured error responses

## Contributing

1. Follow TypeScript strict mode
2. Maintain test coverage ≥ 80%
3. Use ESLint + Prettier for code formatting
4. Document API changes in Swagger comments
5. Update this README for significant changes

## License

ISC
