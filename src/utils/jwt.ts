import jwt from 'jsonwebtoken';
import { config } from '../config';

const JWT_SECRET = config.jwtSecret;

export const signToken = (payload: { id: string; role: string }) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET) as { id: string; role: string };
};
