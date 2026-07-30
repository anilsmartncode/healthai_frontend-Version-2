import { SecureAsyncStorage as notificationStorage } from '@/utils/storage';
import { UnifiedNotification, NotificationProvider, NotificationStatus } from '@/types/notifications';

const STORAGE_KEY = 'healthai_notifications_cache';

class NotificationService {
  private providers: NotificationProvider[] = [];
  private cache: UnifiedNotification[] = [];
  private isLoaded = false;
  private listeners: (() => void)[] = [];

  constructor() {
    // Initialization is deferred to init()
  }

  /** Load persisted notifications from MMKV/AsyncStorage */
  public async init() {
    if (this.isLoaded) return;
    try {
      const raw = await notificationStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          this.cache = JSON.parse(raw);
          this.cleanupCache(); // Cleanup expired immediately on load
        } catch (e) {
          console.error('[NotificationService] failed to parse cache:', e);
          this.cache = [];
        }
      }
    } catch (e) {
      console.error('[NotificationService] failed to get item:', e);
    }
    this.isLoaded = true;
  }

  /** Subscribe to state changes */
  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(l => l());
  }

  /** Persist to MMKV and notify */
  private async saveCache() {
    await notificationStorage.setItem(STORAGE_KEY, JSON.stringify(this.cache));
    this.notifyListeners();
  }

  /** Publish a new notification immediately */
  public publish(notification: UnifiedNotification) {
    const existingIdx = this.cache.findIndex(c => c.id === notification.id);
    if (existingIdx >= 0) {
      this.cache[existingIdx] = notification;
    } else {
      this.cache.push(notification);
    }
    this.cleanupCache();
    this.saveCache(); // fire and forget
  }

  /** Register a domain provider (Reports, Medicines, Family) */
  public registerProvider(provider: NotificationProvider) {
    if (!this.providers.find((p) => p.id === provider.id)) {
      this.providers.push(provider);
    }
  }

  /** Pull fresh notifications from all registered providers and merge with cache */
  public async fetchAndMerge(): Promise<UnifiedNotification[]> {
    await this.init();
    
    const promises = this.providers.map(p => p.fetchNotifications().catch(e => {
      console.error(`[NotificationService] Provider ${p.id} failed:`, e);
      return [] as UnifiedNotification[];
    }));
    
    const results = await Promise.all(promises);
    const freshNotifications = results.flat();
    
    // Merge strategy: update existing by ID, add new ones, preserve read status of existing
    freshNotifications.forEach(fresh => {
      const existingIdx = this.cache.findIndex(c => c.id === fresh.id);
      if (existingIdx >= 0) {
        // Keep existing status (read/archived), update payload/message
        this.cache[existingIdx] = { ...fresh, status: this.cache[existingIdx].status };
      } else {
        this.cache.push(fresh);
      }
    });

    this.cleanupCache();
    this.saveCache(); // fire and forget
    
    return this.getSortedNotifications();
  }

  /** Clean up expired notifications */
  public cleanupCache() {
    const now = new Date().getTime();
    const originalLength = this.cache.length;
    
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;
    
    this.cache = this.cache.filter(n => {
      const timestamp = new Date(n.timestamp).getTime();
      const age = now - timestamp;
      
      // 1. Remove explicitly expired
      if (n.expiresAt) {
        const expiry = new Date(n.expiresAt).getTime();
        if (now > expiry) return false;
      }
      
      // 2. Retention rules
      if (n.category === 'medicine' && n.status === 'archived') {
        if (age > THIRTY_DAYS) return false;
      } else if ((n.category === 'report' || n.category === 'family') && (n.status === 'read' || n.status === 'archived')) {
        if (age > NINETY_DAYS) return false;
      }
      
      return true;
    });

    if (this.cache.length !== originalLength) {
      this.saveCache();
    }
  }

  /** Sort High -> Medium -> Low -> Time (Newest first) */
  public getSortedNotifications(): UnifiedNotification[] {
    const priorityWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    
    return [...this.cache]
      .sort((a, b) => {
        const pA = priorityWeight[a.priority] || 0;
        const pB = priorityWeight[b.priority] || 0;
        if (pA !== pB) return pB - pA; // Descending priority
        
        const tA = new Date(a.timestamp).getTime();
        const tB = new Date(b.timestamp).getTime();
        return tB - tA; // Descending time
      });
  }

  /** Mark all as read */
  public markAllRead() {
    let changed = false;
    this.cache.forEach(n => {
      if (n.status === 'unread') {
        n.status = 'read';
        changed = true;
      }
    });
    if (changed) {
      this.saveCache();
    }
    // Note: To sync upstream to Family/Medicine backend, we could iterate providers
    // and let them push 'read' status if they support it.
  }

  /** Mark specific as read */
  public markAsRead(id: string) {
    const item = this.cache.find(n => n.id === id);
    if (item && item.status === 'unread') {
      item.status = 'read';
      this.saveCache(); // saveCache will notify
    }
  }

  /** Archive a notification to remove it from feed */
  public archive(id: string) {
    const item = this.cache.find(n => n.id === id);
    if (item) {
      item.status = 'archived';
      this.saveCache();
    }
  }

  public getUnreadCount(): number {
    return this.cache.filter(n => n.status === 'unread').length;
  }
}

// Singleton instance
export const NotificationCenter = new NotificationService();
