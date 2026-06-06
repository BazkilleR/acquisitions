import logger from '#config/logger.js';
import bcrypt from 'bcrypt';
import { signUpSchema, signInSchema } from '#validations/auth.validation.js';
import { formatValidationError } from '#utils/format.js';
import { createUser, getUserByEmail } from '#services/auth.service.js';
import { jwttoken } from '#utils/jwt.js';
import { cookies } from '#utils/cookies.js';

export const signup = async (req, res, next) => {
  try {
    const validation = signUpSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validation.error),
      });
    }

    const { name, email, password, role } = validation.data;
    const user = await createUser({ name, email, password, role });

    const token = jwttoken.sign({ id: user.id, email: user.email, role: user.role });
    cookies.set(res, 'token', token);

    logger.info(`User registered: ${email}`);
    res.status(201).json({
      message: 'User registered',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    if (error.message === 'User already exists') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    logger.error('Signup error:', error);
    next(error);
  }
};

export const signin = async (req, res, next) => {
  try {
    const validation = signInSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validation.error),
      });
    }

    const { email, password } = validation.data;
    const user = await getUserByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwttoken.sign({ id: user.id, email: user.email, role: user.role });
    cookies.set(res, 'token', token);

    logger.info(`User signed in: ${email}`);
    res.json({
      message: 'Signed in',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    logger.error('Signin error:', error);
    next(error);
  }
};

export const signout = (req, res) => {
  cookies.clear(res, 'token');
  logger.info(`User signed out: ${req.user?.email}`);
  res.json({ message: 'Signed out' });
};
