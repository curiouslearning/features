import { StatsigClient } from '@statsig/js-client';
import { LocalStorageCache } from '../../utils/storage/local-storage';

// TODO: move this to env variable
const STATSIG_CLIENT_KEY = 'client-SSmY5k5Cs39G7II74NdWqPfv5hQzrFiUqCc3C1IU9na';

export class FeatureFlagsService {
  private storage = new LocalStorageCache('CRFeatureFlags');
  private statsigClient: StatsigClient;

  constructor(public metaData) {
    this.statsigClient = new StatsigClient(STATSIG_CLIENT_KEY, { userID: metaData?.userId || null });
  }

  /**
   * Online method to initialize statsig features and experiments.
   * 
   * Silently fails if offline and will rely on cached data.
   */
  async initialize() {
    try {
      await this.statsigClient.initializeAsync();
    } catch (e) {
      // do nothing, or catch errors when in PWA context. Here, we rely on whatever's stored in localstorage.
    }
  }

  /**
   * TODO: create localstorage cache to store flags
   */
  loadFeatures(featureKeys: string[]) {
    featureKeys.forEach((feature) => {
      this.storage.set(feature, this.statsigClient.checkGate(feature))
    });
  }

  /**
   * Checks whether feature flag is enabled or not.
   * @param key experiment key
   * @returns {boolean}
   */
  isFeatureEnabled(featureKey: string): boolean {
    if (this.storage.isSet(featureKey)) return this.storage.get(featureKey) as boolean;

    let isEnabled = this.statsigClient.checkGate(featureKey);
    this.storage.set(featureKey, isEnabled);
    return isEnabled;
  }

  getExperiment(experimentKey: string, properties: string[] = []): any {
    let experiment;

    if (this.storage.isSet(experimentKey)) {
			experiment = this.storage.get(experimentKey);
    } else {
			experiment = this.statsigClient.getLayer(experimentKey);
			this.storage.set(experimentKey, experiment);
		}

		return properties.length ? properties.map((prop: string) => experiment.get(prop)) : experiment;
  }
}