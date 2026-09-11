import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import MasterConfiguration from './MasterConfiguration';
import api from '../../services/api';
import { BEFORE_ROUTE_CHANGE_EVENT } from '../../utils/routing';

jest.mock('../../services/api', () => ({ get: jest.fn(), put: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn(), download: jest.fn() }));

const structure = {
  id: 'fashion', name: 'Fashion & Clothing', industry: 'fashion', version: 2, active: true,
  attributes: [{ key: 'material', label: 'Material', type: 'text', unit: '', required: false, filterable: true, searchable: true, showOnCard: false, showOnDetail: true, showInSpecifications: true, variant: false, options: [], defaultValue: '', group: 'Specifications', validation: {} }],
  features: { sizing: true, specifications: true, comparison: false, perishable: false, customization: false, technical: false },
  clientPermissions: { content: true, payments: true }, defaultCategories: ['Sarees'], categoryDefinitions: [],
  filters: [{ key: 'category', label: 'Category', type: 'value', enabled: true }], sortingOptions: [{ key: 'newest', label: 'Newest' }], measurementUnits: ['cm'],
  variantConfig: { enabled: true, attributes: [] }, productSections: ['overview', 'specifications'], productCard: { fields: ['name', 'price'], attributeKeys: [] },
  inventory: { mode: 'variant', lowStockThreshold: 5, allowBackorder: false, trackBatch: false, trackExpiry: false, trackSerial: false },
  delivery: { requiresWeight: true, supportsScheduledDelivery: false, supportsLocalOnly: false }, returns: { mode: 'return', defaultWindowDays: 7, nonReturnableWhenCustomized: false },
  seo: { titlePattern: '{product} | {store}', descriptionAttributes: [] }, homepageSections: ['hero'], recommendationGroups: ['similar'], badges: ['new'],
};
const history = { items: [], page: 1, pages: 1, total: 0 };
const planPricing = {
  revision: 0, currency: 'INR', taxMode: 'INCLUSIVE', gstPercent: 18, updatedAt: null,
  plans: [
    { id: 'BASIC', name: 'Starter', description: 'New store essentials', prices: { monthly: 999, yearly: 9990, lifetime: 24999 }, features: [], limits: { products: 100, ordersPerMonth: 150 } },
    { id: 'PROFESSIONAL', name: 'Professional', description: 'Growing store tools', prices: { monthly: 1999, yearly: 19990, lifetime: 49999 }, features: [], limits: { products: 1000, ordersPerMonth: 2000 } },
    { id: 'PREMIUM', name: 'Premium', description: 'Complete operations', prices: { monthly: 3499, yearly: 34990, lifetime: 89999 }, features: [], limits: { products: 10000, ordersPerMonth: 20000 } },
  ],
};
const workspace = (locked = true) => ({
  configuration: { revision: 2, locked, structure, history: [] }, presets: [], admins: [],
  planPricing, plans: planPricing.plans,
  builtins: [{ ...structure, id: 'electronics', name: 'Electronics', industry: 'electronics', attributes: [{ ...structure.attributes[0], key: 'ram', label: 'RAM', unit: 'GB' }], features: { ...structure.features, sizing: false } }],
});
const impactFor = (proposed, risk = 'REVIEW') => ({
  revision: 2, proposed, token: 'impact-token', requiresReview: risk !== 'SAFE', risk,
  changes: [{ path: 'attributes.material', kind: 'CHANGED', risk, before: 'Material', after: 'Fabric composition' }],
  counts: { products: 0, publishedProducts: 0, productsNeedingReview: 0, missingRequired: 0, legacyProducts: 0, categoryProducts: 0, variantProducts: 0, drafts: 0, carts: 0, activeOrders: 0, categories: 0 },
  warnings: [], preserves: ['Products', 'Orders'], estimatedMinutes: 1, maintenanceRecommended: false, examples: [],
});

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  api.get.mockImplementation(async (path) => path.startsWith('/master/configuration/history?') ? history : workspace());
  api.post.mockImplementation(async (path, body) => path === '/master/configuration/impact' ? impactFor(body.structure) : {});
});

test('locked configuration protects schema and template import while project generation stays available', async () => {
  render(<MasterConfiguration />);
  expect(await screen.findByText('Configuration locked')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Electronics/ })).toBeEnabled();
  fireEvent.click(screen.getByRole('button', { name: 'Product schema' }));
  expect(screen.getByLabelText('Field key')).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Presets' }));
  expect(screen.getByRole('button', { name: 'Import structure' })).toBeDisabled();
  expect(api.put).not.toHaveBeenCalled();
});

test('unlock uses an accessible confirmation and current revision before enabling owner editing', async () => {
  api.put.mockResolvedValue(workspace(false).configuration);
  render(<MasterConfiguration />);
  fireEvent.click(await screen.findByRole('button', { name: 'Unlock configuration' }));
  const dialog = screen.getByRole('alertdialog');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Unlock configuration' }));
  await waitFor(() => expect(api.put).toHaveBeenCalledWith('/master/configuration', { revision: 2, locked: false }));
  expect(await screen.findByText('Owner editing enabled')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Product schema' }));
  expect(screen.getByLabelText('Field key')).toBeEnabled();
});

test('master owner publishes backend-controlled monthly yearly and lifetime prices', async () => {
  const saved = { ...planPricing, revision: 1, updatedAt: '2026-09-11T12:00:00.000Z', plans: planPricing.plans.map((plan) => plan.id === 'PROFESSIONAL' ? { ...plan, prices: { ...plan.prices, monthly: 2199 } } : plan) };
  api.put.mockImplementation(async (path) => path === '/master/plan-pricing' ? saved : workspace(false).configuration);
  render(<MasterConfiguration />);
  fireEvent.click(await screen.findByRole('button', { name: 'Plan pricing' }));
  expect(screen.getByText('Subscription price book')).toBeInTheDocument();
  expect(screen.getByLabelText('Professional monthly price')).toHaveValue(1999);
  fireEvent.change(screen.getByLabelText('Professional monthly price'), { target: { value: '2199' } });
  fireEvent.change(screen.getByLabelText('Reason for pricing change'), { target: { value: 'Updated Professional monthly offer' } });
  fireEvent.click(screen.getByRole('button', { name: 'Review & save prices' }));
  fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Save plan pricing' }));
  await waitFor(() => expect(api.put).toHaveBeenCalledWith('/master/plan-pricing', expect.objectContaining({
    revision: 0, reason: 'Updated Professional monthly offer', taxMode: 'INCLUSIVE', gstPercent: 18,
    prices: expect.objectContaining({ PROFESSIONAL: { monthly: 2199, yearly: 19990, lifetime: 49999 } }),
  })));
  expect(await screen.findByText(/Subscription pricing saved/)).toBeInTheDocument();
  expect(screen.getByLabelText('Professional monthly price')).toHaveValue(2199);
});

test('industry choice opens an isolated project builder and never changes the active structure', async () => {
  api.get.mockImplementation(async (path) => path.startsWith('/master/configuration/history?') ? history : workspace(false));
  render(<MasterConfiguration />);
  fireEvent.click(await screen.findByRole('button', { name: /Electronics/ }));
  expect(screen.getByRole('dialog', { name: 'Generate a separate project' })).toBeInTheDocument();
  expect(screen.getByText('Electronics blueprint')).toBeInTheDocument();
  expect(api.put).not.toHaveBeenCalled();
});

test('standalone project can be reviewed and downloaded without store data', async () => {
  api.get.mockImplementation(async (path) => path.startsWith('/master/configuration/history?') ? history : workspace(false));
  const preview = { projectName: 'Rohit Mobiles', projectSlug: 'rohit-mobiles', downloadName: 'rohit-mobiles.zip', sourceFiles: 500, approximateSourceBytes: 5242880, includes: ['Frontend application'], excludes: ['Existing products and orders'] };
  api.post.mockResolvedValue(preview); api.download.mockResolvedValue(new Blob(['PK'], { type: 'application/zip' }));
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: jest.fn(() => 'blob:project') });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: jest.fn() });
  const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  render(<MasterConfiguration />);
  fireEvent.click(await screen.findByRole('button', { name: /Electronics/ }));
  fireEvent.change(screen.getByLabelText('Company / store name'), { target: { value: 'Rohit Mobiles' } });
  fireEvent.click(screen.getByRole('button', { name: 'Review package' }));
  expect(await screen.findByText('rohit-mobiles.zip')).toBeInTheDocument();
  expect(api.post).toHaveBeenCalledWith('/master/projects/preview', expect.objectContaining({ companyName: 'Rohit Mobiles', industry: 'electronics' }));
  fireEvent.click(screen.getByRole('button', { name: 'Generate project ZIP' }));
  await waitFor(() => expect(api.download).toHaveBeenCalledWith('/master/projects/generate', expect.objectContaining({ companyName: 'Rohit Mobiles', industry: 'electronics' })));
  expect(click).toHaveBeenCalled(); expect(api.put).not.toHaveBeenCalled(); click.mockRestore();
});

test('review and publish sends the impact token and retains edits on a conflict', async () => {
  api.get.mockImplementation(async (path) => path.startsWith('/master/configuration/history?') ? history : workspace(false));
  api.put.mockRejectedValue(new Error('Configuration changed in another session. Reload before continuing.'));
  render(<MasterConfiguration />);
  fireEvent.click(await screen.findByRole('button', { name: 'Product schema' }));
  fireEvent.change(screen.getByLabelText('Customer-facing label'), { target: { value: 'Fabric composition' } });
  fireEvent.click(screen.getByRole('button', { name: 'Review & publish' }));
  expect(await screen.findByRole('dialog', { name: 'Review configuration impact' })).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Publish note'), { target: { value: 'Clarify material label' } });
  fireEvent.click(screen.getByRole('button', { name: 'Publish configuration' }));
  expect(await screen.findByText(/Configuration changed in another session/)).toBeInTheDocument();
  expect(screen.getByLabelText('Customer-facing label')).toHaveValue('Fabric composition');
  window.confirm = jest.fn(() => false);
  const event = new CustomEvent(BEFORE_ROUTE_CHANGE_EVENT, { cancelable: true }); window.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(true);
  expect(api.put).toHaveBeenCalledWith('/master/configuration', expect.objectContaining({ revision: 2, impactToken: 'impact-token', note: 'Clarify material label' }));
});

test('impact review exports the exact product review queue without exposing the token', async () => {
  api.get.mockImplementation(async (path) => path.startsWith('/master/configuration/history?') ? history : workspace(false));
  api.post.mockImplementation(async (path, body) => {
    if (path === '/master/configuration/impact') {
      const result = impactFor(body.structure, 'BREAKING');
      result.counts.products = 1; result.counts.productsNeedingReview = 1;
      result.examples = [{ id: 'product-1', name: 'Legacy saree', sku: 'SC-1', categoryDefinitionKey: 'sarees' }];
      return result;
    }
    if (path === '/master/configuration/impact/products') return { total: 1, truncated: false, items: [{ id: 'product-1', name: 'Legacy saree', reasons: ['Removed attributes: retired_field'] }] };
    return {};
  });
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: jest.fn(() => 'blob:affected-products') });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: jest.fn() });
  const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  render(<MasterConfiguration />);
  fireEvent.click(await screen.findByRole('button', { name: 'Product schema' }));
  fireEvent.change(screen.getByLabelText('Customer-facing label'), { target: { value: 'Fabric composition' } });
  fireEvent.click(screen.getByRole('button', { name: 'Review & publish' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Export affected products' }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/master/configuration/impact/products', expect.objectContaining({ structure: expect.any(Object), impactToken: 'impact-token', page: 1, limit: 10000 })));
  expect(click).toHaveBeenCalled();
  click.mockRestore();
});

test('network error offers retry without creating a configuration', async () => {
  api.get.mockRejectedValueOnce(new Error('Network unavailable'));
  render(<MasterConfiguration />);
  expect(await screen.findByText('Network unavailable')).toBeInTheDocument();
  api.get.mockImplementation(async (path) => path.startsWith('/master/configuration/history?') ? history : workspace());
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expect(await screen.findByText('Configuration locked')).toBeInTheDocument(); expect(api.post).not.toHaveBeenCalled();
});

test('private presets archive safely and never change the active store', async () => {
  const preset = { _id: 'private', key: 'my-fashion', name: 'My fashion preset', revision: 1, isActive: true, archivedAt: null, structure };
  api.get.mockImplementation(async (path) => path.startsWith('/master/configuration/history?') ? history : workspace(false));
  api.post.mockImplementation(async (path, body) => path === '/master/clone' ? preset : impactFor(body.structure));
  api.delete.mockResolvedValue({ archived: true, preset: { ...preset, revision: 2, isActive: false, archivedAt: '2026-09-11T00:00:00.000Z' }, usage: { activeStores: 1, savedConfigurations: 1, installations: 0, historyReferences: 1 } });
  render(<MasterConfiguration />);
  fireEvent.click(await screen.findByRole('button', { name: 'Presets' }));
  fireEvent.change(screen.getByLabelText('New preset name'), { target: { value: 'My fashion preset' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save editor as private preset' }));
  expect(await screen.findByText('My fashion preset')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Archive preset My fashion preset' }));
  fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Archive preset' }));
  expect(await screen.findByText(/archived safely/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Restore preset' })).toBeInTheDocument();
  expect(api.delete).toHaveBeenCalledWith('/master/presets/private'); expect(api.put).not.toHaveBeenCalled();
});

test('single-installation handover confirms access and preserves values after failure', async () => {
  api.post.mockRejectedValueOnce(new Error('Phone cannot be granted access')).mockResolvedValueOnce({});
  render(<MasterConfiguration />);
  fireEvent.click(await screen.findByRole('button', { name: 'Presets' }));
  fireEvent.change(screen.getByLabelText('Client name'), { target: { value: 'Store client' } });
  fireEvent.change(screen.getByLabelText('Client mobile number'), { target: { value: '9000000002' } });
  fireEvent.click(screen.getByRole('button', { name: 'Grant client admin access' }));
  fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Grant admin access' }));
  await screen.findByText('Phone cannot be granted access');
  expect(screen.getByLabelText('Client mobile number')).toHaveValue('9000000002');
  fireEvent.click(screen.getByRole('button', { name: 'Grant client admin access' }));
  fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Grant admin access' }));
  expect(await screen.findByText(/Client access granted/)).toBeInTheDocument();
  expect(api.post).toHaveBeenLastCalledWith('/master/client-admins', { name: 'Store client', phone: '9000000002' });
});

test('template import stays private until explicit review and publish', async () => {
  api.get.mockImplementation(async (path) => path.startsWith('/master/configuration/history?') ? history : workspace(false));
  render(<MasterConfiguration />);
  fireEvent.click(await screen.findByRole('button', { name: 'Presets' }));
  const input = screen.getByLabelText('Import store template');
  fireEvent.change(input, { target: { files: [{ size: 64001, text: async () => '{}' }] } });
  await screen.findByText('Choose a store template under 64 KB.');
  const template = { format: 'samira-store-template', version: 1, structure: { ...structure, name: 'Imported fashion' } };
  fireEvent.change(input, { target: { files: [{ size: 800, text: async () => JSON.stringify(template) }] } });
  expect(await screen.findByText(/loaded into your private draft/i)).toBeInTheDocument();
  expect(api.post).toHaveBeenCalledWith('/master/configuration/impact', { structure: template.structure }); expect(api.put).not.toHaveBeenCalled();
});

test('template export uses saved configuration and blocks unsaved drafts', async () => {
  const template = { format: 'samira-store-template', version: 1, structure };
  api.get.mockImplementation(async (path) => path === '/master/export' ? template : path.startsWith('/master/configuration/history?') ? history : workspace(false));
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: jest.fn(() => 'blob:template') });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: jest.fn() });
  const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  render(<MasterConfiguration />);
  fireEvent.click(await screen.findByRole('button', { name: 'Presets' })); fireEvent.click(screen.getByRole('button', { name: 'Export structure' }));
  await waitFor(() => expect(click).toHaveBeenCalledTimes(1));
  fireEvent.click(screen.getByRole('button', { name: 'Product schema' }));
  fireEvent.change(screen.getByLabelText('Customer-facing label'), { target: { value: 'Fabric' } });
  fireEvent.click(screen.getByRole('button', { name: 'Presets' })); fireEvent.click(screen.getByRole('button', { name: 'Export structure' }));
  expect(await screen.findByText('Save your draft first; exports use the saved configuration.')).toBeInTheDocument(); expect(click).toHaveBeenCalledTimes(1); click.mockRestore();
});

test('granular capabilities render and history restores a version only as a draft', async () => {
  const versions = { items: [{ id: 'v1', revision: 1, kind: 'PUBLISH', note: 'Initial catalog', locked: true, changes: [] }], page: 1, pages: 1, total: 1 };
  api.get.mockImplementation(async (path) => {
    if (path.startsWith('/master/configuration/history?')) return versions;
    if (path === '/master/configuration/history/1') return { revision: 1, structure: { ...structure, name: 'Restored structure' } };
    return workspace(false);
  });
  render(<MasterConfiguration />);
  fireEvent.click(await screen.findByRole('button', { name: 'Permissions' }));
  expect(screen.getByText('Shipping settings')).toBeInTheDocument(); expect(screen.getByText('Staff management')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /History/ })); fireEvent.click(await screen.findByRole('button', { name: 'Restore as draft' }));
  expect(await screen.findByText(/Revision 1 loaded as an editable draft/)).toBeInTheDocument(); expect(api.put).not.toHaveBeenCalled();
});
