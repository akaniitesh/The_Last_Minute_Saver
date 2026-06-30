import { BaseService } from "./BaseService";
import { storageService } from "./StorageService";
import { SettingsState } from "../types/settings";
import { STORAGE_KEYS, DEFAULT_SETTINGS } from "../utils/constants";
import { eventBus } from "./EventBus";

export class SettingsService extends BaseService {
  protected name = "SettingsService";
  private currentSettings!: SettingsState;

  protected onInitialize(): void {
    this.currentSettings = storageService.get<SettingsState>(
      STORAGE_KEYS.SETTINGS,
      DEFAULT_SETTINGS as unknown as SettingsState
    );
  }

  protected onDispose(): void {
    // No-op
  }

  getSettings(): SettingsState {
    return this.currentSettings;
  }

  updateSettings(updates: Partial<SettingsState>): void {
    this.currentSettings = {
      ...this.currentSettings,
      ...updates,
      voice: {
        ...this.currentSettings.voice,
        ...(updates.voice || {})
      }
    };

    storageService.set(STORAGE_KEYS.SETTINGS, this.currentSettings);
    eventBus.emit("settings_changed", this.currentSettings);
  }
}

export const settingsService = new SettingsService();
export default settingsService;
