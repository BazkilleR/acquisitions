import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '#config/database.js';
import { user } from '#models/user.model.js';
import logger from '#config/logger.js';
import { jwttoken } from '#utils/jwt.js';
import { cookies } from '#utils/cookies.js';
import { signUpSchema, signInSchema } from '#validations/auth.validation.js';
import { formatValidationError } from '#utils/format.js';

const hashPassword = password => {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
};

const verifyPassword = (password, stored) => {
  const [salt, hash] = stored.split(':');
  const hashBuf = scryptSync(password, salt, 64);
  return timingSafeEqual(hashBuf, Buffer.from(hash, 'hex'));
};

export const signup = async (req, res, next) => {
  try {
    const result = signUpSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(result.error),
      });
    }

    const { name, email, password, role } = result.data;

    const existing = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, email))
      .limit(1);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const [newUser] = await db
      .insert(user)
      .values({ name, email, password: hashPassword(password), role })
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });

    const token = jwttoken.sign({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });
    cookies.set(res, 'token', token);

    logger.info(`User registered: ${email}`);
    return res.status(201).json({ message: 'User registered', user: newUser });
  } catch (error) {
    logger.error('Signup error:', error);
    return next(error);
  }
};

export const signin = async (req, res, next) => {
  try {
    const result = signInSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(result.error),
      });
    }

    const { email, password } = result.data;

    const [found] = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);
    if (!found || !verifyPassword(password, found.password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwttoken.sign({
      id: found.id,
      email: found.email,
      role: found.role,
    });
    cookies.set(res, 'token', token);

    logger.info(`User signed in: ${email}`);
    return res.status(200).json({
      message: 'Signed in',
      user: {
        id: found.id,
        name: found.name,
        email: found.email,
        role: found.role,
      },
    });
  } catch (error) {
    logger.error('Signin error:', error);
    return next(error);
  }
};

export const signout = (_req, res) => {
  cookies.clear(res, 'token');
  return res.status(200).json({ message: 'Signed out' });
};
