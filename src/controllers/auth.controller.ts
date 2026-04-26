import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { hashPassword, comparePassword } from '../utils/hash';
import { signToken } from '../utils/jwt';
import { registerSchema, loginSchema } from '../models/auth.schema';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role } = registerSchema.parse(req).body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        role,
      },
    });

    const token = signToken({ id: user.id, role: user.role });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { token, user: { id: user.id, name: user.name, role: user.role } },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req).body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = signToken({ id: user.id, role: user.role });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { token, user: { id: user.id, name: user.name, role: user.role } },
    });
  } catch (error) {
    next(error);
  }
};
