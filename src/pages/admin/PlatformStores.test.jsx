import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import PlatformStores from './PlatformStores';
import api from '../../services/api';

jest.mock('../../services/api', () => ({ get: jest.fn(), post: jest.fn(), patch: jest.fn() }));
const mockNotify = jest.fn();
jest.mock('../../context/AuthContext', () => ({ useAuth: () => ({ notify: mockNotify }) }));

const plan = { id: 'PROFESSIONAL', name: 'Professional', description: 'Growing store', features: ['catalog', 'orders', 'analytics'], limits: { products: 1000, ordersPerMonth: 2000 }, prices: { monthly: 1999, yearly: 19990, lifetime: 49999 } };
const store = {
  id: '68c2b22e48c154cd49394001', revision: 0, name: 'Riya Fashion', legalName: 'Riya Fashion', slug: 'riya-fashion',
  logo: '', customDomain: '', status: 'PUBLISHED', archivedAt: null, checkoutEnabled: true, paymentReady: true, shippingReady: true,
  pickupAddress: { fullName: 'Riya', mobile: '9999999991', pincode: '110001', city: 'Delhi', state: 'Delhi' },
  returnAddress: { fullName: 'Riya', mobile: '9999999991', pincode: '110001', city: 'Delhi', state: 'Delhi' },
  supportPhone: '9999999991', supportEmail: 'support@example.com', whatsappNumber: '9999999991', isDefault: false,
  industry: 'fashion', industryRevision: 0, migration: { status: 'READY', canRollback: false },
  owner: { id: '68c2b22e48c154cd49394002', name: 'Riya', phone: '9999999991', isBlocked: false },
  platform: { ...plan, status: 'TRIAL', billingCycle: 'TRIAL', daysRemaining: 30, featureOverrides: [], disabledFeatures: [], limitOverrides: { products: null, ordersPerMonth: null } },
  usage: { products: 12, ordersPerMonth: 8, paidRevenueMonth: 12999 }, readiness: { ready: true, percent: 100, steps: { identity: true, brand: true, contact: true, pickup: true, returns: true, payments: true, shipping: true, catalog: true } },
  createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-10T00:00:00.000Z', publishedAt: '2026-09-02T00:00:00.000Z',
};
const list = { stores: [store], summary: { total: 1, active: 0, trials: 1, expiring: 0, suspended: 0, migrationPending: 0, setupIncomplete: 0 }, pagination: { page: 1, limit: 20, total: 1, pages: 1 }, plans: [plan], industryOptions: [{ industry: 'fashion', name: 'Fashion' }, { industry: 'jewellery', name: 'Jewellery' }] };
const operations = { store, members: [{ id: '68c2b22e48c154cd49394003', role: 'OWNER', status: 'ACTIVE', user: store.owner }], payments: [], activity: [], related: { draftProducts: 0, activeCarts: 0, activeOrders: 0 }, roles: ['MANAGER', 'CATALOG_MANAGER'] };

beforeEach(() => {
  jest.clearAllMocks();
  api.get.mockImplementation(async (path) => path.includes('/operations') ? operations : list);
});

async function openStore() {
  render(<PlatformStores />);
  expect(await screen.findByText('Store portfolio')).toBeInTheDocument();
  fireEvent.click(screen.getAllByRole('button', { name: /Manage/ })[0]);
  expect(await screen.findByRole('dialog', { name: 'Manage Riya Fashion' })).toBeInTheDocument();
}

test('renders operational list and opens the responsive store workspace', async () => {
  await openStore();
  expect(screen.getByText('Action centre')).toBeInTheDocument();
  expect(screen.getByText('₹12,999')).toBeInTheDocument();
  expect(api.get).toHaveBeenCalledWith(expect.stringMatching(/^\/master\/stores\?/));
  expect(api.get).toHaveBeenCalledWith(`/master/stores/${store.id}/operations`);
});

test('grant shortcut sends a narrow idempotent payload without unsaved settings', async () => {
  api.post.mockResolvedValue({ store: { ...store, revision: 1, platform: { ...store.platform, status: 'ACTIVE', billingCycle: 'MONTHLY' } }, duplicate: false });
  await openStore();
  fireEvent.click(screen.getByRole('button', { name: 'Subscription' }));
  expect(screen.getByText('₹19,990')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /1 month/ }));
  const prompt = screen.getByRole('alertdialog');
  fireEvent.change(within(prompt).getByLabelText('Reason'), { target: { value: 'Client paid for September' } });
  fireEvent.click(within(prompt).getByRole('button', { name: 'Confirm' }));
  await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
  const [path, body] = api.post.mock.calls[0];
  expect(path).toBe(`/master/stores/${store.id}/subscription/grants`);
  expect(body).toEqual(expect.objectContaining({ baseRevision: 0, plan: 'PROFESSIONAL', billingCycle: 'MONTHLY', reason: 'Client paid for September' }));
  expect(body.idempotencyKey).toMatch(/^grant:/);
  expect(body).not.toHaveProperty('industry');
  expect(body).not.toHaveProperty('featureOverrides');
  expect(body).not.toHaveProperty('limitOverrides');
});

test('destructive lifecycle actions require a reason and the current revision', async () => {
  api.patch.mockResolvedValue({ store: { ...store, revision: 1, checkoutEnabled: false } });
  await openStore();
  fireEvent.click(screen.getByRole('button', { name: 'Storefront' }));
  fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
  const prompt = screen.getByRole('alertdialog');
  expect(within(prompt).getByRole('button', { name: 'Confirm' })).toBeDisabled();
  fireEvent.change(within(prompt).getByLabelText('Reason'), { target: { value: 'Warehouse maintenance' } });
  fireEvent.click(within(prompt).getByRole('button', { name: 'Confirm' }));
  await waitFor(() => expect(api.patch).toHaveBeenCalledWith(`/master/stores/${store.id}/lifecycle`, { baseRevision: 0, action: 'PAUSE', reason: 'Warehouse maintenance' }));
});
