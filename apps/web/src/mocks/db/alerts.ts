import type { AlertList, AppNotification, NotificationList } from '@stockers/shared';
import type { MockDb } from './db';
import type { StoredNotification } from './state';

// The counter's bell and the owners' notifications are two separate lists (screens 3 and 36).

/** Alerts that have already happened on the demo clock, newest first. */
export function counterAlerts(db: MockDb): AlertList {
  const now = db.now();
  const alerts = db.s.counterAlerts.filter((a) => Date.parse(a.at) <= now);
  return { alerts, unread: alerts.filter((a) => !a.read).length };
}

/** The number on the counter's bell. */
export function counterUnread(db: MockDb): number {
  return counterAlerts(db).unread;
}

export function readAllCounterAlerts(db: MockDb): AlertList {
  db.s.counterAlerts.forEach((a) => {
    a.read = true;
  });
  return counterAlerts(db);
}

/**
 * An owner notification is unread until the owners read it. `readAt` says when that was, so a
 * notification can be unread at 10:30 PM and read by 3:45 AM.
 */
function isRead(note: StoredNotification, now: number): boolean {
  return note.read && (note.readAt === undefined || Date.parse(note.readAt) <= now);
}

function visible(db: MockDb): AppNotification[] {
  const now = db.now();
  return db.s.notifications
    .filter((n) => Date.parse(n.at) <= now)
    .map((stored) => {
      const note: AppNotification & { readAt?: string } = { ...stored, read: isRead(stored, now) };
      delete note.readAt;
      return note;
    });
}

export function ownerNotifications(db: MockDb): NotificationList {
  const notifications = visible(db);
  return { notifications, unread: notifications.filter((n) => !n.read).length };
}

/** The number on the owners' bell. */
export function ownerUnread(db: MockDb): number {
  return ownerNotifications(db).unread;
}

export function readAllOwnerNotifications(db: MockDb): NotificationList {
  db.s.notifications.forEach((n) => {
    n.read = true;
    delete n.readAt;
  });
  return ownerNotifications(db);
}
