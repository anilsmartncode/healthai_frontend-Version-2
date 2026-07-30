export type NotificationPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type NotificationCategory = 'report' | 'medicine' | 'family' | 'system';
export type NotificationStatus = 'unread' | 'read' | 'archived';

export interface NotificationAction {
  type: 'navigate' | 'modal' | 'none';
  route?: any; // Generic any route for Expo Router
  params?: Record<string, string | number | undefined>;
}

export interface UnifiedNotification {
  id: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  status: NotificationStatus;
  title: string;
  message: string;
  timestamp: string; // ISO string
  action: NotificationAction;
  expiresAt?: string; // ISO string for auto-expiry
  payload?: any; // Extensible payload for specific handlers
}

export interface NotificationProvider {
  id: string;
  fetchNotifications: () => Promise<UnifiedNotification[]>;
}
