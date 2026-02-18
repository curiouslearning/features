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
});

await featureFlagsService.initialize();

const isEnabled = featureFlagsService.isFeatureEnabled('new-onboarding');

const [variant] = featureFlagsService.getExperiment('onboarding-experiment', ['variant']);

const uiConfig = featureFlagsService.getDynamicConfig('ui-config');
const bannerText = (uiConfig['bannerText'] as string) ?? 'Welcome';

await featureFlagsService.updateUser({
	userID: 'user-123',
	locale: 'en-US',
	plan: 'pro',
});
```

## Singleton usage

`featureFlagsService` is a singleton instance. Call `init` once (typically at app startup), then reuse it everywhere. If the user changes, call `updateUser` instead of re-initializing.

## Caching behavior

Feature gates, experiments, and dynamic config are network-first with cache fallback. If a network call fails, the last cached value from local storage is used.
