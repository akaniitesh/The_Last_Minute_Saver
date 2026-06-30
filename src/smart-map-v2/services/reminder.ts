import { Reminder, ReminderSettings, ReminderType, ReminderCategory } from "../types/reminder";
import { NotificationService } from "./notification";
import { TripPlanningService } from "./tripPlanning";
import { Coordinates } from "../types/map";

export class ReminderService {
  private static STORAGE_KEY = "smart_map_reminders";
  private static SETTINGS_KEY = "smart_map_reminder_settings";

  static getSettings(): ReminderSettings {
    if (typeof window === "undefined") {
      return this.getDefaultSettings();
    }
    const settings = localStorage.getItem(this.SETTINGS_KEY);
    if (!settings) {
      return this.getDefaultSettings();
    }
    try {
      return { ...this.getDefaultSettings(), ...JSON.parse(settings) };
    } catch (err) {
      console.error("Error parsing reminder settings", err);
      return this.getDefaultSettings();
    }
  }

  static saveSettings(settings: ReminderSettings): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent("smart_map_settings_updated"));
  }

  private static getDefaultSettings(): ReminderSettings {
    return {
      enableBrowserNotifications: false,
      enableWeatherAlerts: true,
      enableTrafficAlerts: true,
      enableAISuggestions: true,
      defaultBufferMinutes: 10,
      notificationVolume: 0.8,
    };
  }

  static getReminders(): Reminder[] {
    if (typeof window === "undefined") return [];
    const reminders = localStorage.getItem(this.STORAGE_KEY);
    if (!reminders) return [];
    try {
      return JSON.parse(reminders);
    } catch (err) {
      console.error("Error parsing reminders", err);
      return [];
    }
  }

  static saveReminders(reminders: Reminder[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reminders));
    window.dispatchEvent(new CustomEvent("smart_map_reminders_updated"));
  }

  /**
   * Create a new reminder.
   */
  static createReminder(
    title: string,
    type: ReminderType,
    category: ReminderCategory,
    details: {
      description?: string;
      targetTime?: string; // ISO string
      locationName?: string;
      coords?: Coordinates;
      triggerDistanceMeters?: number;
      trafficDelayMinutesThreshold?: number;
      weatherRainProbabilityThreshold?: number;
      isSilent?: boolean;
    }
  ): Reminder {
    const now = new Date().toISOString();
    const id = Math.random().toString(36).substring(2, 9);

    const reminder: Reminder = {
      id,
      title,
      description: details.description,
      type,
      category,
      targetTime: details.targetTime,
      locationName: details.locationName,
      coords: details.coords,
      triggerDistanceMeters: details.triggerDistanceMeters,
      trafficDelayMinutesThreshold: details.trafficDelayMinutesThreshold,
      weatherRainProbabilityThreshold: details.weatherRainProbabilityThreshold,
      status: "upcoming",
      isSilent: details.isSilent,
      createdAt: now,
      updatedAt: now,
    };

    // Calculate trip planning suggestions if target time and destination coordinates exist
    if (details.coords && details.targetTime) {
      const settings = this.getSettings();
      // Let's assume default origin is Manhattan center if not available
      const origin: Coordinates = { lat: 40.7128, lng: -74.0060 };
      const tripPlan = TripPlanningService.planTrip(
        origin,
        details.coords,
        "car",
        details.targetTime,
        settings.defaultBufferMinutes
      );

      reminder.tripDetails = {
        distanceKm: tripPlan.distanceKm,
        durationMin: tripPlan.totalDurationMin,
        expectedTrafficDelayMin: tripPlan.trafficDelayMin,
        recommendedDepartureTime: tripPlan.recommendedDepartureTime,
        estimatedArrivalTime: tripPlan.estimatedArrivalTime,
        bufferMinutes: tripPlan.bufferMin,
      };
    }

    const currentReminders = this.getReminders();
    this.saveReminders([...currentReminders, reminder]);

    return reminder;
  }

  static deleteReminder(id: string): void {
    const filtered = this.getReminders().filter((r) => r.id !== id);
    this.saveReminders(filtered);
  }

  static updateReminderStatus(id: string, status: "upcoming" | "completed" | "dismissed"): void {
    const reminders = this.getReminders().map((r) => {
      if (r.id === id) {
        return {
          ...r,
          status,
          updatedAt: new Date().toISOString(),
        };
      }
      return r;
    });
    this.saveReminders(reminders);
  }

  /**
   * Missed Reminder Recovery: Checks on startup if any upcoming time-based reminders
   * were passed while the user was away, notifies them about what they missed,
   * and completes them gracefully.
   */
  static recoverMissedReminders(): void {
    const now = new Date();
    const reminders = this.getReminders();
    let hasChanges = false;

    const updated = reminders.map((r) => {
      if (r.status === "upcoming" && r.targetTime) {
        const target = new Date(r.targetTime);
        // If target time was more than 5 minutes in the past
        if (target.getTime() < now.getTime() - 5 * 60 * 1000) {
          hasChanges = true;
          
          // Trigger missed notification log silently
          NotificationService.triggerNotification(
            `Missed Reminder: ${r.title}`,
            `This scheduled reminder was set for ${target.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}.`,
            r.category,
            true, // Silent notification inside history logs
            r.id
          );

          return {
            ...r,
            status: "completed" as const,
            updatedAt: now.toISOString(),
          };
        }
      }
      return r;
    });

    if (hasChanges) {
      this.saveReminders(updated);
    }
  }

  /**
   * Evaluates active upcoming reminders against conditions (time, weather, traffic).
   * Runs inside a polling cycle in the main provider/applet.
   */
  static checkActiveReminders(currentCoords?: Coordinates): void {
    const now = new Date();
    const reminders = this.getReminders();
    let hasChanges = false;

    const updated = reminders.map((r) => {
      if (r.status !== "upcoming") return r;

      let shouldTrigger = false;
      let triggerTitle = r.title;
      let triggerBody = r.description || "Your reminder is active.";

      // 1. Time-based check
      if (r.targetTime) {
        const target = new Date(r.targetTime);
        const diffMs = target.getTime() - now.getTime();
        
        // Trigger if within 30 seconds of target time or in past but not yet fully recovered
        if (diffMs <= 30000 && diffMs > -300000) {
          shouldTrigger = true;
          triggerTitle = `🔔 Reminder: ${r.title}`;
          triggerBody = r.description || `It's time for your ${r.category} alert!`;
        }
      }

      // 2. Weather-based check (Trigger if rain probability exceeds threshold)
      if (r.coords && r.weatherRainProbabilityThreshold !== undefined) {
        const weather = TripPlanningService.getWeatherForLocation(r.coords);
        if (weather.rainProbability >= r.weatherRainProbabilityThreshold) {
          shouldTrigger = true;
          triggerTitle = `🌧️ Rain Alert: ${r.title}`;
          triggerBody = `High probability of rain (${weather.rainProbability}%) expected at ${r.locationName || "your target destination"}. ${weather.description}`;
        }
      }

      // 3. Traffic-based check (Trigger if delays exceed threshold)
      if (r.coords && currentCoords && r.trafficDelayMinutesThreshold !== undefined) {
        const traffic = TripPlanningService.getTrafficForRoute(currentCoords, r.coords, "car");
        if (traffic.delayMinutes >= r.trafficDelayMinutesThreshold) {
          shouldTrigger = true;
          triggerTitle = `🚗 High Traffic Alert: ${r.title}`;
          triggerBody = `Delays on your route have reached ${traffic.delayMinutes} minutes! ${traffic.description}`;
        }
      }

      // 4. Trip recommended departure departure-time check
      if (r.tripDetails && r.tripDetails.recommendedDepartureTime) {
        const departure = new Date(r.tripDetails.recommendedDepartureTime);
        const diffMs = departure.getTime() - now.getTime();
        
        // Trigger departure alert within 1 minute of recommended leave window
        if (diffMs <= 60000 && diffMs > -60000) {
          shouldTrigger = true;
          triggerTitle = `⏱️ Time to Leave: ${r.title}`;
          triggerBody = `Recommended departure is now to arrive by ${new Date(
            r.tripDetails.estimatedArrivalTime
          ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} (${r.tripDetails.durationMin}m duration).`;
        }
      }

      if (shouldTrigger) {
        hasChanges = true;
        NotificationService.triggerNotification(triggerTitle, triggerBody, r.category, !!r.isSilent, r.id);
        
        return {
          ...r,
          status: "completed" as const,
          updatedAt: now.toISOString(),
        };
      }

      return r;
    });

    if (hasChanges) {
      this.saveReminders(updated);
    }
  }
}
