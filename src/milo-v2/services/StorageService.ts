import { BaseService } from "./BaseService";
import { storage } from "../utils/storage";

export class StorageService extends BaseService {
  protected name = "StorageService";

  protected onInitialize(): void {
    // Initialized
  }

  protected onDispose(): void {
    // Clean up
  }

  get<T>(key: string, defaultValue: T): T {
    return storage.get<T>(key, defaultValue);
  }

  set<T>(key: string, value: T): boolean {
    return storage.set<T>(key, value);
  }

  remove(key: string): boolean {
    return storage.remove(key);
  }
}

export const storageService = new StorageService();
export default storageService;
