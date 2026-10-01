import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User, IUser } from '../models/User.model';
import { generateToken, AuthenticatedRequest } from '../middleware/auth.middleware';

const COOKIE_NAME = 'token';
const isProduction = process.env.NODE_ENV === 'production';

const setAuthCookie = (res: Response, token: string): void => {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });
};

const sanitizeUser = (user: IUser) => {
  return {
    id: user._id,
    universityId: user.universityId,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    department: user.department,
    specialization: user.specialization,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { universityId, name, email, password, role, phone, department, specialization } =
      req.body;

    // Check if universityId or email already registered
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { universityId: universityId.toUpperCase() }],
    });

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'Email' : 'University ID';
      res.status(409).json({
        success: false,
        message: `${field} is already registered in the UniHealth portal.`,
      });
      return;
    }

    // Hash password with salt rounds = 10
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      universityId: universityId.toUpperCase(),
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: role || 'civilian',
      phone,
      department,
      specialization,
      isActive: true,
    });

    const token = generateToken({
      userId: newUser._id.toString(),
      universityId: newUser.universityId,
      role: newUser.role,
    });

    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      token,
      user: sanitizeUser(newUser),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error occurred while registering user.',
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, password } = req.body;

    const trimmedIdentifier = identifier.trim();
    const isEmail = trimmedIdentifier.includes('@');

    // Find user by either email or universityId
    const query = isEmail
      ? { email: trimmedIdentifier.toLowerCase() }
      : { universityId: trimmedIdentifier.toUpperCase() };

    const user = await User.findOne(query).select('+passwordHash');

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.',
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact UniHealth Admin.',
      });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password incorrect.',
      });
      return;
    }

    const token = generateToken({
      userId: user._id.toString(),
      universityId: user.universityId,
      role: user.role,
    });

    setAuthCookie(res, token);

    res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: sanitizeUser(user),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error occurred during login.',
    });
  }
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthenticated.' });
      return;
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      user: sanitizeUser(user),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving user profile.',
    });
  }
};
