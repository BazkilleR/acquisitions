import logger from '#config/logger.js';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { db } from '#config/database.js';
import { users } from '#models/users.model.js';

export const hashPassword = async password => {
  try {
    return await bcrypt.hash(password, 10);
  } catch (error) {
    logger.error('Error hashing password:', error);
    throw new Error('Error hashing');
  }
};

export const createUser = async ({ name, email, password, role = 'user' }) => {
  try {
    const existingUser = db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new Error('User already exists');
    }

    const password_hash = await hashPassword(password);

    const [newUser] = await db
      .insert(users)
      .values({ name, email, password_hash, role })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      });

    logger.info(`User created successfully: ${email}`);
  } catch (error) {
    logger.error('Error creating user:', error);
    throw error;
  }
};
