import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ProductForm from '../../components/admin/ProductForm';
import CategoryForm from '../../components/admin/CategoryForm';
import VariantGroups from './VariantGroups';
import Returns from './Returns';
import Reports from './Reports';
import Settings from './Settings';
import api from '../../services/api';
jest.mock('../../services/api', () => ({ get: jest.fn(), put: jest.fn(), post: jest.fn(), delete: jest.fn() }));
jest.mock('../../components/admin/ImageUploader', () => () => <div>Photo picker</div>);
jest.mock('../../components/admin/VideoUploader', () => () => <div>Video picker</div>);
jest.mock('../../utils/catalogOptions', () => ({ fetchCategories: async () => [{ _id: 'cat', name: 'Sarees' }], fetchSubcategories: async () => [] }));
beforeEach(() => { jest.clearAllMocks(); localStorage.clear(); api.get.mockResolvedValue({ features: { sizing: false }, attributes: [] }); jest.spyOn(window, 'confirm').mockReturnValue(true); });
afterEach(() => jest.restoreAllMocks());

test('missing product or category edit IDs never turn into create forms', () => {
  const view = render(<ProductForm mode="Update" />);
  expect(screen.getByRole('alert')).toHaveTextContent('Choose a product');
  expect(screen.queryByRole('button', { name: 'Update Product' })).not.toBeInTheDocument();
  view.unmount();
  render(<CategoryForm mode="Update" />);
  expect(screen.getByRole('alert')).toHaveTextContent('Choose a category');
  expect(api.post).not.toHaveBeenCalled();
});

test('failed product loads preserve cached edits and retry without exposing an empty editor', async () => {
  localStorage.setItem('samira-admin-product-draft:product-a', JSON.stringify({ name: 'Protected local draft' }));
  let fail = true;
  api.get.mockImplementation(async path => {
    if (path === '/catalog-configuration') return { features: { sizing: false }, attributes: [] };
    if (fail) throw new Error('Product could not load');
    return { _id: 'product-a', name: 'Server saree', images: [], sizes: [], colors: [], tags: [] };
  });
  render(<ProductForm mode="Update" productId="product-a" />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Product could not load');
  expect(screen.queryByPlaceholderText('Product name')).not.toBeInTheDocument();
  expect(localStorage.getItem('samira-admin-product-draft:product-a')).toContain('Protected local draft');
  fail = false; fireEvent.click(screen.getByRole('button', { name: 'Retry loading product' }));
  expect(await screen.findByRole('button', { name: 'Update Product' })).toBeInTheDocument();
});

test('late product reads cannot replace another selected edit target', async () => {
  let firstRead;
  api.get.mockImplementation(path => path === '/catalog-configuration' ? Promise.resolve({ features: { sizing: false }, attributes: [] }) : path.endsWith('/a')
    ? new Promise(resolve => { firstRead = resolve; }) : Promise.resolve({ name: 'Current green saree', sizes: [], colors: [], tags: [], images: [] }));
  const view = render(<ProductForm mode="Update" productId="a" />);
  view.rerender(<ProductForm mode="Update" productId="b" />);
  await screen.findByDisplayValue('Current green saree');
  await act(async () => { firstRead({ name: 'Stale rose saree', sizes: [], colors: [], tags: [], images: [] }); });
  expect(screen.queryByDisplayValue('Stale rose saree')).not.toBeInTheDocument();
  expect(screen.getByDisplayValue('Current green saree')).toBeInTheDocument();
});

test('category editing retries reads then saves a controlled update payload', async () => {
  api.get.mockRejectedValueOnce(new Error('Category unavailable')).mockResolvedValueOnce({ name: 'Sarees', slug: 'sarees', isActive: true });
  api.put.mockResolvedValue({});
  render(<CategoryForm mode="Update" categoryId="cat" />);
  fireEvent.click(await screen.findByRole('button', { name: 'Retry loading category' }));
  fireEvent.change(await screen.findByLabelText('Name'), { target: { value: 'Festive sarees' } });
  fireEvent.click(screen.getByRole('button', { name: 'Update Category' }));
  await waitFor(() => expect(api.put).toHaveBeenCalledWith('/admin/categories/cat', expect.objectContaining({ name: 'Festive sarees', isActive: true })));
  expect(api.post).not.toHaveBeenCalled();
});

test('variant group delete failures are actionable and preserve the group for retry', async () => {
  api.get.mockImplementation(async path => path === '/admin/variant-groups' ? { data: [{ _id: 'group', name: 'Rose family', products: [], sizes: [], colors: [] }] } : []);
  api.delete.mockRejectedValueOnce(new Error('Group deletion failed')).mockResolvedValueOnce({ success: true });
  render(<VariantGroups />);
  fireEvent.click(await screen.findByRole('button', { name: 'Delete group' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Group deletion failed');
  expect(screen.getByRole('heading', { name: 'Rose family' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Delete group' }));
  await waitFor(() => expect(screen.queryByRole('heading', { name: 'Rose family' })).not.toBeInTheDocument());
});

test('a failed return update cannot undo a successful update on a different request', async () => {
  api.get.mockResolvedValue([{ _id: 'return-a', status: 'Requested' }, { _id: 'return-b', status: 'Requested' }]);
  let failFirst;
  api.put.mockImplementation(path => path.includes('return-a') ? new Promise((_resolve, reject) => { failFirst = reject; }) : Promise.resolve({ status: 'Approved' }));
  render(<Returns />);
  fireEvent.change(await screen.findByRole('combobox', { name: 'Status for return-a' }), { target: { value: 'Approved' } });
  fireEvent.change(screen.getByRole('combobox', { name: 'Status for return-b' }), { target: { value: 'Approved' } });
  await waitFor(() => expect(screen.getByRole('combobox', { name: 'Status for return-b' })).toHaveValue('Approved'));
  await act(async () => { failFirst(new Error('First request failed')); });
  expect(screen.getByRole('combobox', { name: 'Status for return-a' })).toHaveValue('Requested');
  expect(screen.getByRole('combobox', { name: 'Status for return-b' })).toHaveValue('Approved');
});

test('report range changes ignore late results and show the selected range', async () => {
  const late = [];
  api.get.mockImplementation(path => path.includes('range=30d') ? new Promise(resolve => late.push(resolve)) : Promise.resolve(path.includes('/sales') ? { totals: { revenue: 700 } } : {}));
  render(<Reports />);
  fireEvent.click(screen.getByRole('button', { name: '7 days' }));
  await screen.findByText('Rs. 700');
  await act(async () => { late.forEach(resolve => resolve({ totals: { revenue: 3000 } })); });
  expect(screen.getByText('Rs. 700')).toBeInTheDocument();
  expect(screen.queryByText('Rs. 3000')).not.toBeInTheDocument();
});

test('optional payment readiness failure leaves settings editable and reports successful saves accurately', async () => {
  api.get.mockImplementation(async path => { if (path.endsWith('/payment-readiness')) throw new Error('Gateway check unavailable'); return { storeName: 'My shop', returnWindowDays: 0, gstRate: 5.5 }; });
  api.put.mockResolvedValue({ storeName: 'Updated shop', returnWindowDays: 0, gstRate: 5.5 });
  render(<Settings />);
  fireEvent.change(await screen.findByLabelText('Store Name'), { target: { value: 'Updated shop' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save Settings' }));
  expect(await screen.findByText('Settings saved successfully.')).toBeInTheDocument();
  expect(api.put).toHaveBeenCalledWith('/admin/settings', expect.objectContaining({ storeName: 'Updated shop', returnWindowDays: 0, gstRate: 5.5 }));
  expect(screen.getByRole('button', { name: 'Retry payment check' })).toBeInTheDocument();
});
