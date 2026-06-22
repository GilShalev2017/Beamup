import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/user.model';
import { AppError } from '../middleware/errorHandler';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

export const signToken = (payload: TokenPayload): string =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);

export const verifyToken = (token: string): TokenPayload =>
  jwt.verify(token, JWT_SECRET) as TokenPayload;

export class AuthService {
  async register(email: string, password: string, name: string, role?: string): Promise<{ user: Omit<IUser, 'password'>; token: string }> {
    const existing = await User.findOne({ email });
    if (existing) throw new AppError('Email already in use', 409);

    const user = await User.create({ email, password, name, role: role ?? 'viewer' });

    const token = signToken({ id: user.id, email: user.email, role: user.role });

    // Strip password from response
    const userObj = user.toObject() as Record<string, unknown>;
    delete userObj.password;

    return { user: userObj as Omit<IUser, 'password'>, token };
  }

  async login(email: string, password: string): Promise<{ user: Omit<IUser, 'password'>; token: string }> {
    // Explicitly select password (it's excluded by default via `select: false`)
    const user = await User.findOne({ email }).select('+password');
    if (!user) throw new AppError('Invalid email or password', 401);

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new AppError('Invalid email or password', 401);

    const token = signToken({ id: user.id, email: user.email, role: user.role });

    const userObj = user.toObject() as Record<string, unknown>;
    delete userObj.password;

    return { user: userObj as Omit<IUser, 'password'>, token };
  }

  async me(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    return user;
  }
}

export const authService = new AuthService();
