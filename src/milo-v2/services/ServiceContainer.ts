import { BaseService } from "./BaseService";
import { storageService } from "./StorageService";
import { settingsService } from "./SettingsService";
import { geminiService } from "./GeminiService";
import { speechService } from "./SpeechService";
import { logger } from "../utils/logger";

class ServiceContainer {
  private services: BaseService[] = [
    storageService,
    settingsService,
    geminiService,
    speechService
  ];
  private isInitialized = false;

  async initializeAll(): Promise<void> {
    if (this.isInitialized) return;

    logger.info("Initializing all Milo V2 Services...");
    for (const service of this.services) {
      try {
        await service.initialize();
      } catch (error) {
        logger.error(`Critical failure in ServiceContainer initialization chain:`, error);
        // We let the remaining services initialize but flag the error
      }
    }
    this.isInitialized = true;
    logger.info("All Milo V2 Services initialized.");
  }

  async disposeAll(): Promise<void> {
    if (!this.isInitialized) return;

    logger.info("Disposing all Milo V2 Services...");
    for (const service of this.services) {
      try {
        await service.dispose();
      } catch (error) {
        logger.error(`Error disposing service:`, error);
      }
    }
    this.isInitialized = false;
    logger.info("All Milo V2 Services disposed.");
  }
}

export const serviceContainer = new ServiceContainer();
export default serviceContainer;
