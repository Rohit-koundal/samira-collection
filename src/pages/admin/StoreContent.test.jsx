import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import StoreContent from './StoreContent';
import api from '../../services/api';
const mockRefresh = jest.fn();
jest.mock('../../services/api', () => ({ get: jest.fn(), put: jest.fn() }));
jest.mock('../../context/WebsiteCustomizationContext', () => ({ useWebsiteCustomization: () => ({ refresh: mockRefresh }) }));
const data = { available: true, revision: '2026-09-01T00:00:00Z', content: { websiteName: 'Client shop', tagline: 'Welcome' }, sections: [{ id: 'hero', label: 'Hero', heading: 'New arrivals', description: '', buttonText: 'Shop' }] };
beforeEach(() => { jest.clearAllMocks(); jest.spyOn(window, 'confirm').mockReturnValue(true); api.get.mockResolvedValue(data); mockRefresh.mockResolvedValue(); });
afterEach(() => { jest.restoreAllMocks(); });

test('client editor only sends content and revision, never layout or store type', async () => {
  api.put.mockResolvedValue({ revision: '2026-09-05T00:00:00Z' });
  render(<StoreContent />);
  const field = await screen.findByLabelText('Website name');
  expect(screen.getByRole('button', { name: 'Publish content' })).toBeDisabled();
  fireEvent.change(field, { target: { value: 'My boutique' } });
  fireEvent.click(screen.getByRole('button', { name: 'Publish content' }));
  await waitFor(() => expect(api.put).toHaveBeenCalledWith('/admin/store-content', { revision: data.revision, content: { ...data.content, websiteName: 'My boutique' }, sections: data.sections }));
  expect(await screen.findByText('Content published. Layout and store structure are unchanged.')).toBeInTheDocument();
  expect(mockRefresh).toHaveBeenCalledTimes(1);
});

test('failed save retains client wording', async () => {
  api.put.mockRejectedValue(new Error('Reload before saving.'));
  render(<StoreContent />);
  fireEvent.change(await screen.findByLabelText('Website name'), { target: { value: 'Keep this edit' } });
  fireEvent.click(screen.getByRole('button', { name: 'Publish content' }));
  expect(await screen.findByText('Reload before saving.')).toBeInTheDocument();
  expect(screen.getByLabelText('Website name')).toHaveValue('Keep this edit');
  expect(mockRefresh).not.toHaveBeenCalled();
});

test('missing published configuration has a clear empty state', async () => {
  api.get.mockResolvedValue({ available: false });
  render(<StoreContent />);
  expect(await screen.findByText(/Your store configuration is not ready yet/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Publish content' })).not.toBeInTheDocument();
});
