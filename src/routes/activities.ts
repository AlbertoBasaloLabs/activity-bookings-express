import { Request, Response, Router } from 'express';
import { ActivityService } from '../services/activity.service';
import { CreateActivityRequest, UpdateActivityRequest } from '../types/activity';
import { AuthenticatedRequest } from '../types/auth';
import { authenticateToken } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

const router = Router();
const activityService = new ActivityService();

/**
 * POST /activities
 * Creates a new activity
 * Requires authentication
 * Returns 201 on success, 400 on validation error, 401 on authentication failure
 */
router.post('/', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const errors = activityService.validateCreate(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    if (!authReq.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const activity = activityService.create(req.body as CreateActivityRequest, authReq.user.id);
    res.status(201).json(activity);
  } catch (error) {
    logger.error('ActivityRoute', 'Failed to create activity', error);
    res.status(400).json({ error: 'Failed to create activity' });
  }
});

/**
 * GET /activities
 * Lists all activities
 * No authentication required
 * Returns 200 with array of activities
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const activities = activityService.getAll();
    res.status(200).json(activities);
  } catch (error) {
    logger.error('ActivityRoute', 'Failed to get activities', error);
    res.status(500).json({ error: 'Failed to retrieve activities' });
  }
});

/**
 * GET /activities/:id
 * Gets a specific activity by ID
 * No authentication required
 * Returns 200 on success, 404 if not found
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const activity = activityService.getById(req.params.id);
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    res.status(200).json(activity);
  } catch (error) {
    logger.error('ActivityRoute', 'Failed to get activity', error);
    res.status(500).json({ error: 'Failed to retrieve activity' });
  }
});

/**
 * PUT /activities/:id
 * Updates an existing activity
 * Requires authentication and ownership
 * Returns 200 on success, 400 on validation error, 401 on authentication failure, 403 on ownership failure, 404 if not found
 */
router.put('/:id', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const existingActivity = activityService.getById(req.params.id);
  
  if (!existingActivity) {
    return res.status(404).json({ error: 'Activity not found' });
  }

  const errors = activityService.validateUpdate(req.body, existingActivity);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    if (!authReq.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const activity = activityService.update(req.params.id, req.body as UpdateActivityRequest, authReq.user.id);
    res.status(200).json(activity);
  } catch (error) {
    logger.error('ActivityRoute', 'Failed to update activity', error);
    if (error instanceof Error) {
      if (error.message === 'Activity not found') {
        return res.status(404).json({ error: 'Activity not found' });
      }
      if (error.message.includes('Forbidden')) {
        return res.status(403).json({ error: 'You can only update your own activities' });
      }
    }
    res.status(400).json({ error: 'Failed to update activity' });
  }
});

/**
 * DELETE /activities/:id
 * Deletes an activity
 * Requires authentication and ownership
 * Returns 204 on success, 401 on authentication failure, 403 on ownership failure, 404 if not found
 */
router.delete('/:id', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;

  try {
    if (!authReq.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const deleted = activityService.delete(req.params.id, authReq.user.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    res.status(204).send();
  } catch (error) {
    logger.error('ActivityRoute', 'Failed to delete activity', error);
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return res.status(403).json({ error: 'You can only delete your own activities' });
    }
    res.status(500).json({ error: 'Failed to delete activity' });
  }
});

export default router;
