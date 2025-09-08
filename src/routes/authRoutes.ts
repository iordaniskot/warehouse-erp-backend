import { Router } from 'express';
import { register, login, profile } from '../controllers/authController';
import { protect } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, profile);

export default router;
