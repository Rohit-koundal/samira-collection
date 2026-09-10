import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ProductForm from '../../components/admin/ProductForm';
import CategoryForm from '../../components/admin/CategoryForm';
import VariantGroups from './VariantGroups';
import Returns from './Returns';
import Reports from './Reports';
import Settings from './Settings';
import api from '../../services/api';
const mockVariantRefetch = jest.fn();
const mockVariantArchive = jest.fn();
const mockVariantCreate = jest.fn();
const mockVariantUpdate = jest.fn();
const mockVariantDelete = jest.fn();
const mockVariantRestore = jest.fn();
const mockVariantReconcile = jest.fn();
let mockVariantResponse;
jest.mock('../../services/api', () => ({ get: jest.fn(), put: jest.fn(), post: jest.fn(), delete: jest.fn() }));
jest.mock('../../store/apiSlice', () => ({
  useGetVariantGroupsQuery: () => ({ data: mockVariantResponse, isLoading: false, isFetching: false, error: null, refetch: mockVariantRefetch }),
  useGetVariantGroupCandidatesQuery: () => ({ data: { items: [], totalPages: 1 }, isLoading: false, isFetching: false, error: null, refetch: jest.fn() }),
  useGetManagementCategoriesQuery: () => ({ data: [] }),
  useCreateVariantGroupMutation: () => [mockVariantCreate, { isLoading: false }],
  useUpdateVariantGroupMutation: () => [mockVariantUpdate, { isLoading: false }],
  useDeleteVariantGroupMutation: () => [mockVariantDelete, { isLoading: false }],
  useArchiveVariantGroupMutation: () => [mockVariantArchive, { isLoading: false }],
  useRestoreVariantGroupMutation: () => [mockVariantRestore, { isLoading: false }],
  useReconcileVariantGroupMutation: () => [mockVariantReconcile, { isLoading: false }],
}));
jest.mock('../../components/admin/ImageUploader', () => ({ label, value = [], onChange }) => <div>Photo picker{value[0]?.url ? <><span>{value[0].url}</span><button type="button" aria-label={`Remove ${label}`} onClick={() => onChange([])}>Remove</button></> : null}</div>);
jest.mock('../../components/admin/VideoUploader', () => () => <div>Video picker</div>);
jest.mock('../../utils/catalogOptions', () => ({ fetchCategories: async () => [{ _id: 'cat', name: 'Sarees' }], fetchSubcategories: async () => [] }));
beforeEach(() => {
  jest.clearAllMocks(); localStorage.clear(); api.get.mockResolvedValue({ features: { sizing: false }, attributes: [] }); jest.spyOn(window, 'confirm').mockReturnValue(true);
  mockVariantResponse = { data: [], meta: { page: 1, totalPages: 1, total: 0, summary: { total: 0, active: 0, draft: 0, archived: 0 } } };
  [mockVariantArchive, mockVariantCreate, mockVariantUpdate, mockVariantDelete, mockVariantRestore, mockVariantReconcile].forEach((mock) => mock.mockReturnValue({ unwrap: () => Promise.resolve({ message: 'Saved' }) }));
});
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

test('category editing retries reads, preserves both images and only removes the chosen image', async () => {
  api.get.mockRejectedValueOnce(new Error('Category unavailable')).mockResolvedValueOnce({ name: 'Sarees', slug: 'sarees', image: '/uploads/category.jpg', socialImage: '/uploads/category-social.jpg', isActive: true });
  api.put.mockResolvedValue({});
  render(<CategoryForm mode="Update" categoryId="cat" />);
  fireEvent.click(await screen.findByRole('button', { name: 'Retry loading category' }));
  fireEvent.change(await screen.findByLabelText('Name'), { target: { value: 'Festive sarees' } });
  expect(screen.getByText('/uploads/category.jpg')).toBeInTheDocument();
  expect(screen.getByText('/uploads/category-social.jpg')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Update Category' }));
  await waitFor(() => expect(api.put).toHaveBeenCalledWith('/admin/categories/cat', expect.objectContaining({ name: 'Festive sarees', image: '/uploads/category.jpg', socialImage: '/uploads/category-social.jpg', isActive: true })));
  expect(api.put.mock.calls[0][1]).not.toHaveProperty('removeImage');
  expect(api.put.mock.calls[0][1]).not.toHaveProperty('removeSocialImage');
  fireEvent.click(screen.getByRole('button', { name: 'Remove Choose Category Image' }));
  fireEvent.click(screen.getByRole('button', { name: 'Update Category' }));
  await waitFor(() => expect(api.put).toHaveBeenLastCalledWith('/admin/categories/cat', expect.objectContaining({ image: '', removeImage: true, socialImage: '/uploads/category-social.jpg' })));
  expect(api.put.mock.calls.at(-1)[1]).not.toHaveProperty('removeSocialImage');
  expect(api.post).not.toHaveBeenCalled();
});

test('variant family archive failures are actionable and preserve the family for retry', async () => {
  mockVariantResponse = { data: [{ _id: 'group', name: 'Rose family', products: [{ _id: 'p1', name: 'Rose saree', images: [], stock: 2 }], members: [], optionDefinitions: [], status: 'draft', isArchived: false, health: { state: 'review', score: 70, issues: [], warnings: ['Add an option'] } }], meta: { page: 1, totalPages: 1, total: 1, summary: { total: 1, active: 0, draft: 1, archived: 0 } } };
  mockVariantArchive.mockReturnValueOnce({ unwrap: () => Promise.reject({ data: { message: 'Family archive failed' } }) }).mockReturnValueOnce({ unwrap: () => Promise.resolve({ message: 'Family archived' }) });
  render(<VariantGroups />);
  fireEvent.click(screen.getByRole('button', { name: 'Archive Rose family' }));
  fireEvent.click(screen.getByRole('button', { name: 'Archive family' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Family archive failed');
  expect(screen.getByRole('heading', { name: 'Rose family' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Archive Rose family' }));
  fireEvent.click(screen.getByRole('button', { name: 'Archive family' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Family archived');
  expect(mockVariantArchive).toHaveBeenCalledTimes(2);
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
