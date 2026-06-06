import logger from '#config/logger.js';
import { formatValidationError } from '#utils/format.js';
import {
  userIdSchema,
  updateUserSchema,
} from '#validations/users.validation.js';
import {
  getAllUsers as getAllUsersService,
  getUserById as getUserByIdService,
  updateUser as updateUserService,
  deleteUser as deleteUserService,
} from '#services/users.service.js';

export const fetchAllUsers = async (req, res, next) => {
  try {
    logger.info('Getting users...');
    const allUsers = await getAllUsersService();
    res.json({
      message: 'Successfully retrieved users',
      users: allUsers,
      count: allUsers.length,
    });
  } catch (e) {
    logger.error(e);
    next(e);
  }
};

export const fetchUserById = async (req, res, next) => {
  try {
    const validation = userIdSchema.safeParse(req.params);

    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validation.error),
      });
    }

    const { id } = validation.data;
    const foundUser = await getUserByIdService(id);

    logger.info(`User fetched: ${id}`);
    res.json({ user: foundUser });
  } catch (e) {
    if (e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }
    logger.error(e);
    next(e);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const paramsValidation = userIdSchema.safeParse(req.params);

    if (!paramsValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(paramsValidation.error),
      });
    }

    const bodyValidation = updateUserSchema.safeParse(req.body);

    if (!bodyValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(bodyValidation.error),
      });
    }

    const { id } = paramsValidation.data;
    const updates = bodyValidation.data;

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (updates.role !== undefined && req.user.role !== 'admin') {
      return res
        .status(403)
        .json({ error: 'Only admins can change user roles' });
    }

    const updatedUser = await updateUserService(id, updates);

    logger.info(`User updated: ${id}`);
    res.json({ message: 'User updated', user: updatedUser });
  } catch (e) {
    if (e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }
    logger.error(e);
    next(e);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const validation = userIdSchema.safeParse(req.params);

    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validation.error),
      });
    }

    const { id } = validation.data;

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await deleteUserService(id);

    logger.info(`User deleted: ${id}`);
    res.json({ message: 'User deleted' });
  } catch (e) {
    if (e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }
    logger.error(e);
    next(e);
  }
};
