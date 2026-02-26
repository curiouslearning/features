import { featureFlagsService } from './feature-flag-service';

jest.mock('@statsig/js-client', () => {
  const mockInitializeAsync = jest.fn().mockResolvedValue(true);
  const mockCheckGate = jest.fn().mockReturnValue(true);
  const mockGetDynamicConfig = jest.fn().mockImplementation(() => ({
    value: { 'field-a': 'config-field-a' },
  }));
  const StatsigClient = jest.fn().mockImplementation(() => ({
    initializeAsync: mockInitializeAsync,
    checkGate: mockCheckGate,
    getDynamicConfig: mockGetDynamicConfig,
  }));

  return {
    StatsigClient,
    __mocks: {
      mockInitializeAsync,
      mockCheckGate,
      mockGetDynamicConfig,
    },
  };
});

const statsigMock = jest.requireMock('@statsig/js-client') as {
  StatsigClient: jest.Mock;
  __mocks: {
    mockInitializeAsync: jest.Mock;
    mockCheckGate: jest.Mock;
    mockGetDynamicConfig: jest.Mock;
  };
};

describe('FeatureFlagsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    featureFlagsService.resetForTesting();
  });

  it('initializes the Statsig client', async () => {
    featureFlagsService.init({ user: { userID: 'user-1' } });
    await featureFlagsService.initialize();

    expect(statsigMock.__mocks.mockInitializeAsync).toHaveBeenCalled();
  });

  it('uses cache-first gate checks', () => {
    featureFlagsService.init({ user: { userID: 'user-1' } });

    featureFlagsService.isFeatureEnabled('gate-a');
    featureFlagsService.isFeatureEnabled('gate-a');

    expect(statsigMock.__mocks.mockCheckGate).toHaveBeenCalledTimes(1);
  });

  it('bypasses cache when useCache is false for gates', () => {
    featureFlagsService.init({ user: { userID: 'user-1' } });

    featureFlagsService.isFeatureEnabled('gate-a', false);
    featureFlagsService.isFeatureEnabled('gate-a', false);

    expect(statsigMock.__mocks.mockCheckGate).toHaveBeenCalledTimes(2);
  });

  it('uses cache-first dynamic config reads', () => {
    featureFlagsService.init({ user: { userID: 'user-1' } });

    const first = featureFlagsService.getDynamicConfig('cfg-a');
    const second = featureFlagsService.getDynamicConfig('cfg-a');

    expect(statsigMock.__mocks.mockGetDynamicConfig).toHaveBeenCalledTimes(1);
    expect(first).toEqual({ 'field-a': 'config-field-a' });
    expect(second).toEqual({ 'field-a': 'config-field-a' });
  });

  it('bypasses cache when useCache is false for configs', () => {
    featureFlagsService.init({ user: { userID: 'user-1' } });

    const first = featureFlagsService.getDynamicConfig('cfg-a', false);
    const second = featureFlagsService.getDynamicConfig('cfg-a', false);

    expect(statsigMock.__mocks.mockGetDynamicConfig).toHaveBeenCalledTimes(2);
    expect(first).toEqual({ 'field-a': 'config-field-a' });
    expect(second).toEqual({ 'field-a': 'config-field-a' });
  });

  it('expires cached values after TTL', () => {
    featureFlagsService.init({ user: { userID: 'user-1' } });

    const nowSpy = jest.spyOn(Date, 'now');
    nowSpy.mockReturnValue(1000);

    featureFlagsService.getDynamicConfig('cfg-a');

    nowSpy.mockReturnValue(1000 + 24 * 60 * 60 * 1000 + 1);
    featureFlagsService.getDynamicConfig('cfg-a');

    expect(statsigMock.__mocks.mockGetDynamicConfig).toHaveBeenCalledTimes(2);

    nowSpy.mockRestore();
  });

  it('falls back to stale cache when offline after TTL expiry', () => {
    featureFlagsService.init({ user: { userID: 'user-1' } });

    const nowSpy = jest.spyOn(Date, 'now');
    nowSpy.mockReturnValue(1000);

    statsigMock.__mocks.mockGetDynamicConfig.mockImplementationOnce(() => ({
      value: { 'field-a': 'config-field-a' },
    }));
    const first = featureFlagsService.getDynamicConfig('cfg-a');

    nowSpy.mockReturnValue(1000 + 24 * 60 * 60 * 1000 + 1);
    statsigMock.__mocks.mockGetDynamicConfig.mockImplementationOnce(() => {
      throw new Error('offline');
    });
    const second = featureFlagsService.getDynamicConfig('cfg-a');

    expect(statsigMock.__mocks.mockGetDynamicConfig).toHaveBeenCalledTimes(2);
    expect(first).toEqual({ 'field-a': 'config-field-a' });
    expect(second).toEqual({ 'field-a': 'config-field-a' });

    nowSpy.mockRestore();
  });
});