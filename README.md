# ERP Backend

Express + TypeScript + Mongoose starter.

## Scripts

- `npm run dev` - start with nodemon + ts-node
- `npm run build` - compile to `dist`
- `npm start` - run compiled server

## Environment
Copy `.env.example` to `.env` and adjust values.

```
PORT=4000
MONGODB_URI=mongodb://localhost:27017/erp
JWT_SECRET=change_this_secret
JWT_EXPIRES=7d
```

## Endpoints
- `GET /health` health check
- `POST /api/auth/register` { email, password }
- `POST /api/auth/login` { email, password }
- `GET /api/auth/profile` (Bearer token)

## Notes
- Update password hashing rounds or add rate limiting for production.
- Add validation & logging as needed.
