import { StatsigClient } from '@statsig/js-client';
import { LocalStorageCache } from '../../utils/storage/local-storage';

// TODO: move this to env variable
const STATSIG_CLIENT_KEY = 'client-SSmY5k5Cs39G7II74NdWqPfv5hQzrFiUqCc3C1IU9na';

export type FeatureFlagsUser = {
  userID?: string | null;
  [key: string]: unknown;
};

export interface FeatureFlagsServiceOptions {
  user?: FeatureFlagsUser;
  metaData?: Record<string, unknown>;
}
/**
 * Singleton wrapper class for statsig.
 */
export class FeatureFlagsService {
  private storage = new LocalStorageCache('CRFeatureFlags');
  private statsigClient?: StatsigClient;
  private user: FeatureFlagsUser = { userID: null };

  /**
   * Initializes the singleton and optionally updates the current Statsig user.
   * @param options Optional user payload used to identify the current user.
   * If the client is already created, this triggers a user update instead of re-instantiating.
   */
  init(options?: FeatureFlagsServiceOptions) {
    const resolvedUser = this.resolveUser(options);
    this.user = resolvedUser;

    if (!this.statsigClient) {
      this.statsigClient = new StatsigClient(STATSIG_CLIENT_KEY, resolvedUser as any);
      return;
    }

    void this.updateUser(resolvedUser);
  }

  /**
   * Online method to initialize statsig features and experiments.
   * 
   * Silently fails if offline and will rely on cached data.
   */
  async initialize() {
    try {
      await this.getClient().initializeAsync();
    } catch (e) {
      // do nothing, or catch errors when in PWA context. Here, we rely on whatever's stored in localstorage.
    }
  }

  /**
   * TODO: create localstorage cache to store flags
   */
  loadFeatures(featureKeys: string[]) {
    featureKeys.forEach((feature) => {
      const cacheKey = this.buildCacheKey('gate', feature);
      this.storage.set(cacheKey, this.getClient().checkGate(feature));
    });
  }

  /**
   * Checks whether feature flag is enabled or not.
   * @param key experiment key
   * @returns {boolean}
   */
  isFeatureEnabled(featureKey: string): boolean {
    const cacheKey = this.buildCacheKey('gate', featureKey);
    try {
      const isEnabled = this.getClient().checkGate(featureKey);
      this.storage.set(cacheKey, isEnabled);
      return isEnabled;
    } catch (e) {
      if (this.storage.isSet(cacheKey)) return this.storage.get(cacheKey) as boolean;
      return false;
    }
  }

  getExperiment(experimentKey: string, properties: string[] = []): any {
    if (!properties.length) {
      try {
        return this.getClient().getLayer(experimentKey);
      } catch (e) {
        return null;
      }
    }

    const cacheKey = this.buildCacheKey('layer', experimentKey, properties);
    try {
      const experiment = this.getClient().getLayer(experimentKey);
      const values = properties.map((prop: string) => experiment.get(prop));
      this.storage.set(cacheKey, values);
      return values;
    } catch (e) {
      if (this.storage.isSet(cacheKey)) return this.storage.get(cacheKey);
      return properties.map((): unknown => undefined);
    }
  }

  /**
   * Retrieves a dynamic config value object and caches the payload.
   * @param configKey Dynamic config key.
   * @returns The config payload from Statsig.
   * Network-first with cache fallback. Cached in local storage under a `config:` key scoped by config.
   */
  getDynamicConfig(configKey: string): Record<string, unknown> {
    const cacheKey = this.buildCacheKey('config', configKey);
    try {
      const config = this.getClient().getDynamicConfig(configKey);
      const value = (config?.value ?? {}) as Record<string, unknown>;
      this.storage.set(cacheKey, value);
      return value;
    } catch (e) {
      if (this.storage.isSet(cacheKey)) return this.storage.get(cacheKey) as Record<string, unknown>;
      return {};
    }
  }

  /**
   * Updates the Statsig user without recreating the client when supported.
   * @param user User object with IDs and custom attributes.
   * @returns A promise that resolves after the user update call finishes.
   */
  async updateUser(user: FeatureFlagsUser) {
    this.user = user;

    if (!this.statsigClient) {
      this.statsigClient = new StatsigClient(STATSIG_CLIENT_KEY, user as any);
      return;
    }

    await (this.statsigClient as any).updateUser(user);
  }

  /**
   * Clears any cached gate/config values stored in local storage.
   * Useful when switching users or wanting fresh reads from Statsig.
   */
  clearCache() {
    this.storage.clear();
  }

  /**
   * Resets the singleton state for isolated unit tests.
   * This removes the cached client, user, and local storage data.
   */
  resetForTesting() {
    this.statsigClient = undefined;
    this.user = { userID: null };
    this.clearCache();
  }

  private resolveUser(options?: FeatureFlagsServiceOptions): FeatureFlagsUser {
    if (options?.user) return options.user;
    if (options?.metaData) {
      const metaDataUserId = options.metaData['userId'] ?? options.metaData['userID'] ?? null;
      return { userID: metaDataUserId as string | null, ...options.metaData };
    }

    return this.user;
  }

  private getClient(): StatsigClient {
    if (!this.statsigClient) {
      this.statsigClient = new StatsigClient(STATSIG_CLIENT_KEY, this.user as any);
    }

    return this.statsigClient;
  }

  private buildCacheKey(prefix: string, key: string, properties: string[] = []) {
    if (!properties.length) return `${prefix}:${key}`;
    return `${prefix}:${key}:${properties.join(',')}`;
  }
}

export const featureFlagsService = new FeatureFlagsService();