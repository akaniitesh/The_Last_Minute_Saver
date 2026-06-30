import { NotificationHistoryItem, ReminderCategory } from "../types/reminder";

export class NotificationService {
  private static STORAGE_KEY = "smart_map_notification_history";

  /**
   * Request browser notifications permission.
   * Prompts the user only when they actively enable a reminder or turn on the feature.
   */
  static async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      console.warn("This browser does not support web notifications.");
      return "denied";
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (err) {
      console.error("Error requesting notification permission", err);
      return "default";
    }
  }

  /**
   * Check the current state of browser notifications permission.
   */
  static getPermissionState(): NotificationPermission {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "denied";
    }
    return Notification.permission;
  }

  /**
   * Deliver an active notification to the user's desktop browser (and push to Notification Center log).
   */
  static async triggerNotification(
    title: string,
    body: string,
    category: ReminderCategory = "custom",
    isSilent: boolean = false,
    reminderId?: string
  ): Promise<NotificationHistoryItem> {
    const timestamp = new Date().toISOString();
    const item: NotificationHistoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      body,
      timestamp,
      isRead: false,
      category,
      reminderId,
      isSilent,
    };

    // 1. Deliver web browser visual notification if allowed
    if (!isSilent && typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        const options: any = {
          body,
          icon: "/favicon.ico", // Web PWA icon path
          badge: "/favicon.ico",
          vibrate: [200, 100, 200],
          tag: reminderId || "smart_map_planner",
        };
        new Notification(title, options);
      } catch (err) {
        console.error("Failed to show system notification", err);
      }
    }

    // 2. Add to local notification history logs
    this.addNotificationToHistory(item);

    return item;
  }

  /**
   * Read all persistent notification logs
   */
  static getNotificationHistory(): NotificationHistoryItem[] {
    if (typeof window === "undefined") return [];
    const logs = localStorage.getItem(this.STORAGE_KEY);
    if (!logs) return [];
    try {
      return JSON.parse(logs);
    } catch (err) {
      console.error("Error parsing notification history", err);
      return [];
    }
  }

  /**
   * Store notification log in state
   */
  static addNotificationToHistory(item: NotificationHistoryItem): void {
    if (typeof window === "undefined") return;
    const history = this.getNotificationHistory();
    const updated = [item, ...history].slice(0, 100); // Limit to last 100 items
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));

    // Emit custom event for live component refreshes
    window.dispatchEvent(new CustomEvent("smart_map_notifications_updated"));
  }

  /**
   * Mark all notification logs as read
   */
  static markAllAsRead(): void {
    if (typeof window === "undefined") return;
    const history = this.getNotificationHistory();
    const updated = history.map((item) => ({ ...item, isRead: true }));
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("smart_map_notifications_updated"));
  }

  /**
   * Clear entire history
   */
  static clearHistory(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(this.STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("smart_map_notifications_updated"));
  }
}
