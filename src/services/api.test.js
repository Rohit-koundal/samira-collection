const mockUnsubscribe = jest.fn();
const mockInitiateQuery = jest.fn(() => ({ type: 'query-request' }));
const mockInitiateMutation = jest.fn(() => ({ type: 'mutation-request' }));
const mockDispatch = jest.fn(() => ({
  unwrap: jest.fn().mockResolvedValue({ success: true, data: { progress: 32 } }),
  unsubscribe: mockUnsubscribe,
}));

jest.mock('../store/apiSlice', () => ({
  samiraApi: {
    endpoints: {
      request: { initiate: (...args) => mockInitiateQuery(...args) },
      mutate: { initiate: (...args) => mockInitiateMutation(...args) },
      upload: { initiate: jest.fn() },
    },
  },
}));
jest.mock('../store/store', () => ({ store: { dispatch: (...args) => mockDispatch(...args) } }));
jest.mock('../utils/mobileLoader', () => ({ startMobileLoader: jest.fn(), stopMobileLoader: jest.fn() }));
jest.mock('./imageCompression', () => ({ compressImageFile: jest.fn(), isSupportedImageFile: jest.fn() }));

import api from './api';
import { startMobileLoader, stopMobileLoader } from '../utils/mobileLoader';

beforeEach(() => {
  jest.clearAllMocks();
  mockDispatch.mockImplementation(() => ({
    unwrap: jest.fn().mockResolvedValue({ success: true, data: { progress: 32 } }),
    unsubscribe: mockUnsubscribe,
  }));
});

test('imperative GET requests force a network refresh instead of returning stale RTK cache data', async () => {
  const response = await api.get('/admin/reel-imports/job-1');

  expect(response).toEqual({ success: true, data: { progress: 32 } });
  expect(mockInitiateQuery).toHaveBeenCalledWith(
    { path: '/admin/reel-imports/job-1', silent: undefined },
    { forceRefetch: true, subscribe: false },
  );
  expect(mockUnsubscribe).toHaveBeenCalled();
});

test('background notification polling does not trigger the mobile loading overlay', async () => {
  await api.get('/notifications/summary', { silent: true });
  expect(mockInitiateQuery).toHaveBeenCalledWith({ path: '/notifications/summary', silent: true }, { forceRefetch: true, subscribe: false });
  expect(startMobileLoader).not.toHaveBeenCalled();
  expect(stopMobileLoader).not.toHaveBeenCalled();
});
