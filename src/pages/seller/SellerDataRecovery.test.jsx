import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Products from './Products';
import Crm from './Crm';
import Dashboard from './Dashboard';
import Analytics from './Analytics';
import api from '../../services/api';
jest.mock('../../services/api', () => ({ get: jest.fn() }));
beforeEach(() => jest.resetAllMocks());
test.each([[Products, '/seller/products', 'Product unavailable'], [Crm, '/seller/crm', 'Customers unavailable']])('seller list recovers after failed load without retaining the error', async (Page, path, message) => {
  api.get.mockRejectedValueOnce(new Error(message)).mockResolvedValueOnce([]);
  render(<Page navigate={jest.fn()} />);
  expect(await screen.findByText(message)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  await waitFor(() => expect(screen.queryByText(message)).not.toBeInTheDocument());
  await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
  expect(api.get).toHaveBeenLastCalledWith(path);
});
test('malformed seller products show recovery rather than crashing or claiming the catalog is empty', async () => {
  api.get.mockResolvedValueOnce({ wrong: [] }).mockResolvedValueOnce({ items: [] });
  render(<Products navigate={jest.fn()} />);
  expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('No products yet')).toBeInTheDocument();
});
test('dashboard retries both data dependencies and renders confirmed store statistics', async () => {
  let recover = false;
  api.get.mockImplementation(async path => {
    if (!recover) throw new Error('Store data unavailable');
    return path === '/seller/dashboard/stats' ? { products: 8, orders: 2, revenue: 900, returns: 0 } : { store: { name: 'Silk boutique', slug: 'silk', status: 'LIVE' } };
  });
  const navigate = jest.fn(); render(<Dashboard navigate={navigate} />);
  const retry = await screen.findByRole('button', { name: 'Try again' });
  recover = true; fireEvent.click(retry);
  expect(await screen.findByRole('heading', { name: 'Silk boutique' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Orders' }));
  expect(navigate).toHaveBeenCalledWith('/seller/orders');
});
test('analytics updates the chosen period and can retry that exact failed period', async () => {
  api.get.mockResolvedValueOnce({ events: { PRODUCT_VIEW: 5 } }).mockRejectedValueOnce(new Error('Analytics unavailable')).mockResolvedValueOnce({ events: { PRODUCT_VIEW: 12 }, note: 'Last seven days' });
  render(<Analytics />);
  fireEvent.change(await screen.findByRole('combobox', { name: 'Analytics period' }), { target: { value: '7d' } });
  fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('Last seven days')).toBeInTheDocument();
  expect(screen.getByRole('combobox')).toHaveValue('7d');
  expect(api.get).toHaveBeenLastCalledWith('/seller/analytics/funnel?range=7d');
});
