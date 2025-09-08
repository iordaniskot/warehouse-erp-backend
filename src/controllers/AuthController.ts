import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

const JWT_SECRET = (process.env.JWT_SECRET as jwt.Secret) || 'dev_secret';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

const signToken = (id: string) => jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES } as jwt.SignOptions);

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already in use' });
    const user = await User.create({ email, password });
    const id = (user._id as unknown as string).toString();
    const token = signToken(id);
    res.status(201).json({ token, user: { id, email: user.email } });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    const id = (user._id as unknown as string).toString();
    const token = signToken(id);
    res.json({ token, user: { id, email: user.email } });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Login failed' });
  }
};

export const profile = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Not authorized' });
  const id = (req.user._id as unknown as string).toString();
  res.json({ user: { id, email: req.user.email } });
};
