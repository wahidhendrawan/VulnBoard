import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { RegisterSchema, LoginSchema } from '../schemas';

const router = Router();

// Simple in-memory rate limiter for login (max 10 attempts per IP per 15 min)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

router.post('/register', async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.errors[0].message });
    return;
  }
  const { email, password, name, company } = parsed.data;
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ message: 'Email already registered' });
    return;
  }
  const hashed = await bcrypt.hash(password, 12);
  const user = await db.user.create({ data: { email, password: hashed, name, company } });
  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: '1d', algorithm: 'HS256' });
  res.status(201).json({ token });
});

router.post('/login', async (req: Request, res: Response) => {
  const ip = req.ip ?? 'unknown';
  if (!checkRateLimit(ip)) {
    res.status(429).json({ message: 'Too many login attempts. Try again later.' });
    return;
  }
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.errors[0].message });
    return;
  }
  const { email, password } = parsed.data;
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }
  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: '1d', algorithm: 'HS256' });
  res.json({ token });
});

export default router;
