# features
A wrapper for feature flags, experiments, and dynamic config.

## Usage

```ts
import { featureFlagsService } from '@curiouslearning/features';

featureFlagsService.init({
	user: {
		userID: 'user-123',
		locale: 'en-US',
		language: "english",
		appVersion: '1.2.3',
	},
	cacheTtlMs: 24 * 60 * 60 * 1000,
});

await featureFlagsService.initialize();

const isEnabled = featureFlagsService.isFeatureEnabled('new-onboarding');
const forceNetwork = featureFlagsService.isFeatureEnabled('new-onboarding', false);

const [variant] = featureFlagsService.getExperiment('onboarding-experiment', ['variant']);

const uiConfig = featureFlagsService.getDynamicConfig('ui-config');
const freshUiConfig = featureFlagsService.getDynamicConfig('ui-config', false);
const bannerText = (uiConfig['bannerText'] as string) ?? 'Welcome';

```

## Singleton usage

`featureFlagsService` is a singleton instance. Call `init` once (typically at app startup), then reuse it everywhere.

## Caching behavior

Feature gates, experiments, and dynamic config are cache-first by default. Cached values are stored with a TTL (24 hours by default) and only truthy/non-empty values are cached.

When TTL has expired, the service attempts to refresh from Statsig. If refresh fails (for example, offline mode), it falls back to the stale cached value.

Pass `useCache = false` to bypass cache reads and fetch from the SDK, while still updating the cache for future calls.

Override the TTL via `init({ cacheTtlMs })` when needed.
