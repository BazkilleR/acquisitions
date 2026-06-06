import logger from '#config/logger.js';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { db } from '#config/database.js';
import { user } from '#models/user.model.js';

export const hashPassword = async password => {
  try {
    return await bcrypt.hash(password, 10);
  } catch (error) {
    logger.error('Error hashing password:', error);
    throw new Error('Error hashing', { cause: error });
  }
};

export const getUserByEmail = async email => {
  const [found] = await db
    .select()
    .from(user)
    .where(eq(user.email, email))
    .limit(1);
  return found ?? null;
};

export const createUser = async ({
  name,
  email,
  password: plainPassword,
  role = 'user',
}) => {
  try {
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new Error('User already exists');
    }

    const hashedPassword = await hashPassword(plainPassword);

    const [newUser] = await db
      .insert(user)
      .values({ name, email, password: hashedPassword, role })
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });

    logger.info(`User created successfully: ${email}`);
    return newUser;
  } catch (error) {
    logger.error('Error creating user:', error);
    throw error;
  }
};
