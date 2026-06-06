import { jwttoken } from '#utils/jwt.js';
import { cookies } from '#utils/cookies.js';
import logger from '#config/logger.js';

const authMiddleware = (req, res, next) => {
  const token = cookies.get(req, 'token');

  if (!token) {
    return res
      .status(401)
      .json({ error: 'Unauthorized', message: 'No token provided' });
  }

  try {
    req.user = jwttoken.verify(token);
    next();
  } catch (e) {
    logger.warn('Invalid token attempt', { ip: req.ip, path: req.path });
    return res
      .status(401)
      .json({ error: 'Unauthorized', message: 'Invalid or expired token' });
  }
};

export default authMiddleware;
