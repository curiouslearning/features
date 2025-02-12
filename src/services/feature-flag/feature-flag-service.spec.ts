import { FeatureFlagsService } from './feature-flag-service';

const mockInitializeAsync = jest.fn().mockResolvedValue(true);
jest.mock('@statsig/js-client', () => ({
  StatsigClient: jest.fn().mockImplementation(() => ({
    initializeAsync: mockInitializeAsync
  })),
}));

describe('FeatureFlagsService', () => {
  describe('When initialized empty params', () => {
    const featureFlagService = new FeatureFlagsService({});
    describe('and initialize() is called', () => {
      it('it should call statsig.mockInitializeAsync()', async () => {
        await featureFlagService.initialize();
        expect(mockInitializeAsync).toHaveBeenCalled();
      })
    });
  });
})