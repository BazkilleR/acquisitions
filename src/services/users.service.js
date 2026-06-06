import logger from '#config/logger.js';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { db } from '#config/database.js';
import { user } from '#models/user.model.js';

const safeFields = {
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  created_at: user.created_at,
  updated_at: user.updated_at,
};

export const getAllUsers = async () => {
  try {
    return await db.select(safeFields).from(user);
  } catch (e) {
    logger.error('Error getting users', e);
    throw e;
  }
};

export const getUserById = async id => {
  try {
    const [found] = await db.select(safeFields).from(user).where(eq(user.id, id)).limit(1);

    if (!found) throw new Error('User not found');

    return found;
  } catch (e) {
    logger.error('Error getting user by id', e);
    throw e;
  }
};

export const updateUser = async (id, updates) => {
  try {
    await getUserById(id);

    const data = { ...updates, updated_at: new Date() };

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    const [updated] = await db
      .update(user)
      .set(data)
      .where(eq(user.id, id))
      .returning(safeFields);

    return updated;
  } catch (e) {
    logger.error('Error updating user', e);
    throw e;
  }
};

export const deleteUser = async id => {
  try {
    await getUserById(id);
    await db.delete(user).where(eq(user.id, id));
  } catch (e) {
    logger.error('Error deleting user', e);
    throw e;
  }
};
