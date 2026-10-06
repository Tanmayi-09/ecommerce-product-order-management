import { Router, Response } from 'express';
import { db } from '../db/database.ts';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/notifications
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const notifications =
    user.role === 'admin' ? db.getNotifications() : db.getNotifications(user.id);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  res.status(200).json({
    success: true,
    unreadCount,
    count: notifications.length,
    notifications,
  });
});

// PUT /api/notifications/:id/read
router.put('/:id/read', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const notif = db.markNotificationAsRead(id);

  if (!notif) {
    res.status(404).json({
      success: false,
      message: `Notification '${id}' not found.`,
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Notification marked as read.',
    notification: notif,
  });
});

// PUT /api/notifications/read-all
router.put('/read-all', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  db.markAllNotificationsAsRead(user.id);

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read.',
  });
});

export default router;
