import { logger } from "../utils/logger";

export abstract class BaseService {
  protected abstract name: string;
  protected isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn(`Service "${this.name}" is already initialized.`);
      return;
    }

    try {
      logger.info(`Initializing Service "${this.name}"...`);
      await this.onInitialize();
      this.isInitialized = true;
      logger.info(`Service "${this.name}" initialized successfully.`);
    } catch (error) {
      logger.error(`Failed to initialize Service "${this.name}":`, error);
      throw error;
    }
  }

  async dispose(): Promise<void> {
    if (!this.isInitialized) {
      logger.warn(`Service "${this.name}" is not initialized.`);
      return;
    }

    try {
      logger.info(`Disposing Service "${this.name}"...`);
      await this.onDispose();
      this.isInitialized = false;
      logger.info(`Service "${this.name}" disposed successfully.`);
    } catch (error) {
      logger.error(`Failed to dispose Service "${this.name}":`, error);
    }
  }

  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  protected abstract onInitialize(): Promise<void> | void;
  protected abstract onDispose(): Promise<void> | void;
}
