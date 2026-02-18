import { featureFlagsService } from './feature-flag-service';

jest.mock('@statsig/js-client', () => {
  const mockInitializeAsync = jest.fn().mockResolvedValue(true);
  const mockCheckGate = jest.fn().mockReturnValue(true);
  const mockGetDynamicConfig = jest.fn().mockImplementation(() => ({
    value: { 'field-a': 'config-field-a' },
  }));
  const mockUpdateUser = jest.fn().mockResolvedValue(undefined);
  const StatsigClient = jest.fn().mockImplementation(() => ({
    initializeAsync: mockInitializeAsync,
    checkGate: mockCheckGate,
    getDynamicConfig: mockGetDynamicConfig,
    updateUser: mockUpdateUser,
  }));

  return {
    StatsigClient,
    __mocks: {
      mockInitializeAsync,
      mockCheckGate,
      mockGetDynamicConfig,
      mockUpdateUser,
    },
  };
});

const statsigMock = jest.requireMock('@statsig/js-client') as {
  StatsigClient: jest.Mock;
  __mocks: {
    mockInitializeAsync: jest.Mock;
    mockCheckGate: jest.Mock;
    mockGetDynamicConfig: jest.Mock;
    mockUpdateUser: jest.Mock;
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

  it('updates user without re-instantiating client', async () => {
    featureFlagsService.init({ user: { userID: 'user-1' } });
    await featureFlagsService.updateUser({ userID: 'user-2', locale: 'en' });

    expect(statsigMock.StatsigClient).toHaveBeenCalledTimes(1);
    expect(statsigMock.__mocks.mockUpdateUser).toHaveBeenCalledWith({ userID: 'user-2', locale: 'en' });
  });

  it('uses network-first gate checks', () => {
    featureFlagsService.init({ user: { userID: 'user-1' } });

    featureFlagsService.isFeatureEnabled('gate-a');
    featureFlagsService.isFeatureEnabled('gate-a');

    expect(statsigMock.__mocks.mockCheckGate).toHaveBeenCalledTimes(2);
  });

  it('uses network-first dynamic config reads', () => {
    featureFlagsService.init({ user: { userID: 'user-1' } });

    const first = featureFlagsService.getDynamicConfig('cfg-a');
    const second = featureFlagsService.getDynamicConfig('cfg-a');

    expect(statsigMock.__mocks.mockGetDynamicConfig).toHaveBeenCalledTimes(2);
    expect(first).toEqual({ 'field-a': 'config-field-a' });
    expect(second).toEqual({ 'field-a': 'config-field-a' });
  });

  it('falls back to cached dynamic config on error', () => {
    featureFlagsService.init({ user: { userID: 'user-1' } });

    statsigMock.__mocks.mockGetDynamicConfig
      .mockImplementationOnce(() => ({ value: { 'field-a': 'config-field-a' } }))
      .mockImplementationOnce(() => {
        throw new Error('network error');
      });

    const first = featureFlagsService.getDynamicConfig('cfg-a');
    const second = featureFlagsService.getDynamicConfig('cfg-a');

    expect(statsigMock.__mocks.mockGetDynamicConfig).toHaveBeenCalledTimes(2);
    expect(first).toEqual({ 'field-a': 'config-field-a' });
    expect(second).toEqual({ 'field-a': 'config-field-a' });
  });
});