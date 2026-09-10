import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import Banners from './Banners';
import Categories from './Categories';
import Coupons from './Coupons';
import Customers from './Customers';
import Reviews from './Reviews';
import Support from './Support';
import Subscribers from './Subscribers';
import Dashboard from './Dashboard';
import ProductForm from '../../components/admin/ProductForm';
import Products from './Products';
import ProductCaptionModal from '../../components/admin/ProductCaptionModal';
import api from '../../services/api';
import { applySmartPatch, selectedSmartPatch, suggestionRows } from '../../utils/productSmartFill';
jest.mock('../../services/api', () => ({ get: jest.fn(), put: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() }));
jest.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: { name: 'Owner', systemRole: 'MASTER_OWNER' } }) }));
jest.mock('../../components/admin/ImageUploader', () => ({ onChange, uploadPath, onBusyChange }) => <><button type="button" onClick={() => onChange([{ url: 'https://media.example/photo.jpg' }])}>Upload photo {uploadPath}</button>{onBusyChange ? <><button type="button" onClick={() => onBusyChange(true)}>Begin photo upload</button><button type="button" onClick={() => onBusyChange(false)}>Finish photo upload</button></> : null}</>);
jest.mock('../../components/admin/VideoUploader', () => () => null);
const category = { _id: 'cat', name: 'Sarees', isActive: false };

test.each(['/admin', '/seller'])('Smart Fill uses %s permissions and saves reviewed listing fields through the normal product endpoint', async (prefix) => {
  const configuration = { features: { sizing: false }, attributes: [{ key: 'material', label: 'Material', required: true }] };
  api.get.mockImplementation(async path => path === '/catalog-configuration' ? configuration : path.includes('/categories') ? [category] : path.includes('/smart-fill/status') ? { enabled: true } : []);
  api.post.mockImplementation(async path => path.endsWith('/smart-fill') ? { mode: 'ai', suggestion: { name: 'Wine embroidered saree', category: 'cat', price: 899, originalPrice: 1299, description: 'A wine saree with an embroidered border.', shortDescription: 'Wine saree with an embroidered border.', highlights: ['Embroidered border'], attributeValues: { material: 'Georgette' } }, fieldSources: { price: { quote: 'Price: 899', source: 'caption' }, originalPrice: { quote: 'MRP: 1299', source: 'caption' } } } : { _id: 'created' });
  render(<ProductForm apiPrefix={prefix} uploadPrefix={prefix + '/uploads'} />);
  fireEvent.click(screen.getByRole('button', { name: /Advanced/ }));
  await screen.findByLabelText(/^Material/);
  fireEvent.click(screen.getByRole('button', { name: 'Upload photo ' + prefix + '/uploads' }));
  fireEvent.click(screen.getByRole('button', { name: /Smart fill/ }));
  fireEvent.change(screen.getByLabelText('Supplier notes or product details'), { target: { value: 'Name: Wine saree\nPrice: 899\nMRP: 1299' } });
  fireEvent.click(screen.getByRole('button', { name: 'Suggest details' }));
  await screen.findByText('Review suggestions');
  expect(api.post).toHaveBeenCalledWith(prefix + '/products/smart-fill', expect.objectContaining({ imageUrls: ['https://media.example/photo.jpg'] }), expect.objectContaining({ silent: true }));
  fireEvent.click(screen.getByRole('button', { name: /Apply \d+ selected details/ }));
  expect(screen.getByLabelText(/Product name/)).toHaveValue('Wine embroidered saree');
  expect(screen.getByLabelText(/^Material/)).toHaveValue('Georgette');
  fireEvent.change(screen.getByLabelText('Stock quantity'), { target: { value: '3' } });
  fireEvent.click(screen.getByRole('button', { name: 'Add Product' }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith(prefix + '/products', expect.objectContaining({ name: 'Wine embroidered saree', price: 899, originalPrice: 1299, stock: 3, sizes: [], highlights: ['Embroidered border'], metaTitle: 'Wine embroidered saree', attributeValues: { material: 'Georgette' } })));
});

test('Smart Fill does not replace existing values by default and preserves independently edited attributes on undo', () => {
  const baseline = { name: 'My product', category: 'cat', price: '900', stock: 5, description: '', attributeValues: { material: 'Cotton' } };
  const rows = suggestionRows({ suggestion: { name: 'Suggested product', price: 999, description: 'A useful description.', stock: 100, attributeValues: { material: 'Silk', lining: 'Cotton' } }, fieldSources: { price: { quote: 'Price: 999' } } }, baseline, { categories: [category], structure: { attributes: [{ key: 'material', label: 'Material' }, { key: 'lining', label: 'Lining' }] }, seo: false });
  const patch = selectedSmartPatch(rows, rows.map(row => row.key), baseline);
  const applied = applySmartPatch(baseline, patch);
  expect(applied.name).toBe('My product'); expect(applied.price).toBe('900'); expect(applied.stock).toBe(5);
  expect(applied.description).toBe('A useful description.'); expect(applied.attributeValues).toEqual({ material: 'Cotton', lining: 'Cotton' });
  const undone = applySmartPatch({ ...applied, attributeValues: { material: 'Linen', lining: 'Cotton' } }, patch, true);
  expect(undone.description).toBe(''); expect(undone.attributeValues.material).toBe('Linen'); expect(undone.attributeValues.lining).toBe('');
  expect(selectedSmartPatch(rows, ['name'], baseline, true)[0].value).toBe('Suggested product');
});

test('Smart Fill protects inventory added during analysis and rejects prices that conflict with retained MRP', () => {
  const baseline = { name: '', category: 'cat', price: '', originalPrice: '500', colors: '', sizes: '', subCategory: '', sizingMode: 'auto' };
  const result = { suggestion: { name: 'Silk saree', price: 899, sizes: ['M'], colors: ['Wine'], subCategory: 'Festive', description: 'An embroidered product.' }, fieldSources: { price: { quote: 'Price: 899' } } };
  const rows = suggestionRows(result, baseline, { categories: [category], seo: false });
  const keys = rows.map(row => row.key);
  expect(selectedSmartPatch(rows, keys, baseline).some(row => row.key === 'price')).toBe(false);
  const variants = [{ size: 'L', color: 'Blue', stock: 3 }];
  const next = applySmartPatch({ ...baseline, trackVariants: true, variants }, selectedSmartPatch(rows, keys, { ...baseline, trackVariants: true, variants }));
  expect(next.variants).toEqual(variants); expect(next.name).toBe(''); expect(next.sizes).toBe(''); expect(next.description).toBe('An embroidered product.');
  expect(selectedSmartPatch(rows, keys, { ...baseline, category: 'another' }).some(row => ['subCategory', 'sizes'].includes(row.key))).toBe(false);
});

test('a selectable-size saree exposes missing bust, focuses it on save and can switch to free size', async () => {
  const product = { _id: 'product', name: 'Silk saree', sku: 'SC-SAREE', category: 'cat', price: 900, originalPrice: 1100, stock: 3, description: 'Silk saree with a refined woven finish.', images: [{ url: 'https://media.example/saree.jpg' }], sizingMode: 'sized', sizeChartProfile: 'auto', sizes: ['S'], colors: [], tags: [], sizeChart: { unit: 'in', columns: [], rows: [] } };
  api.get.mockImplementation(async path => path === '/catalog-configuration' ? { features: { sizing: true }, attributes: [] } : path.includes('/categories') ? [category] : path === '/admin/products/product' ? product : []);
  api.put.mockResolvedValue({});
  render(<ProductForm mode="Update" productId="product" />);
  const bust = await screen.findByLabelText('S Bust');
  expect(bust).toHaveValue(null);
  fireEvent.click(screen.getByRole('button', { name: 'Update Product' }));
  expect(api.put).not.toHaveBeenCalled();
  expect(bust).toHaveFocus(); expect(bust).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByRole('alert')).toHaveTextContent('S Bust');
  fireEvent.change(screen.getByLabelText(/^Customer sizing/), { target: { value: 'free-size' } });
  expect(screen.queryByLabelText('S Bust')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Update Product' }));
  await waitFor(() => expect(api.put).toHaveBeenCalledWith('/admin/products/product', expect.objectContaining({ sizingMode: 'free-size', sizes: [], sizeChart: { unit: 'in', columns: [], rows: [] }, stock: 3 })));
});
test('add product points to the first invalid field and cannot save during a media upload', async () => {
  api.get.mockImplementation(async path => path === '/catalog-configuration' ? { features: { sizing: false }, attributes: [] } : path.includes('/categories') ? [category] : []);
  render(<ProductForm />);
  await screen.findByRole('button', { name: 'Add Product' });
  fireEvent.change(screen.getByLabelText(/Product name/), { target: { value: 'A' } });
  fireEvent.click(screen.getByRole('button', { name: 'Add Product' }));
  expect(screen.getByLabelText(/Product name/)).toHaveFocus();
  expect(screen.getAllByText('Product name must be at least 3 characters.').length).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole('button', { name: 'Begin photo upload' }));
  expect(screen.getByRole('button', { name: 'Uploading media...' })).toBeDisabled();
  expect(screen.getByText('Media upload in progress. Saving will be available when it finishes.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Finish photo upload' }));
  expect(screen.getByRole('button', { name: 'Add Product' })).toBeEnabled();
});
test('enabling size-level inventory preserves existing stock and supports products without a colour option', async () => {
  const dressCategory = { _id: 'dress', name: 'Dresses', isActive: true };
  api.get.mockImplementation(async path => path === '/catalog-configuration' ? { features: { sizing: true }, attributes: [] } : path.includes('/categories') ? [dressCategory] : []);
  render(<ProductForm />);
  await screen.findByRole('option', { name: 'Dresses' });
  fireEvent.change(screen.getByRole('combobox', { name: /Category/ }), { target: { value: 'dress' } });
  fireEvent.change(screen.getByLabelText('Stock quantity'), { target: { value: '7' } });
  fireEvent.change(screen.getByLabelText('Selectable sizes'), { target: { value: 'S' } });
  fireEvent.click(screen.getByLabelText('Track stock by size and/or colour'));
  expect(screen.getByLabelText('Total stock (calculated from variants)')).toBeDisabled();
  expect(await screen.findByLabelText('S default stock')).toHaveValue(7);
});

test('copy existing product creates a safe new listing without reusing inventory or unique identifiers', async () => {
  const source = { _id: 'source', name: 'Classic silk saree', sku: 'SILK-1', barcode: '890100000001', category, price: 1200, originalPrice: 1800, stock: 9, description: 'A complete silk saree description for reuse.', images: [{ url: 'https://media.example/silk.jpg', primary: true }], sizes: [], colors: ['Wine'], tags: ['silk'], variants: [] };
  api.get.mockImplementation(async path => {
    if (path === '/catalog-configuration') return { features: { sizing: false }, attributes: [] };
    if (path.includes('/categories')) return [category];
    if (path.includes('page=1&limit=100')) return { items: [source] };
    if (path.includes('/duplicate-check')) return { conflicts: [] };
    return [];
  });
  render(<ProductForm />);
  fireEvent.click(await screen.findByRole('button', { name: /Copy existing/ }));
  const useProduct = await screen.findByRole('button', { name: 'Use product' });
  await act(async () => { fireEvent.click(useProduct); await Promise.resolve(); });
  expect(screen.getByLabelText(/Product name/)).toHaveValue('Classic silk saree copy');
  expect(screen.getByLabelText(/^SKU/)).toHaveValue('');
  expect(screen.getByLabelText('Stock quantity')).toHaveValue(0);
  expect(screen.getByText(/Add a unique SKU/)).toBeInTheDocument();
});
beforeEach(() => { jest.clearAllMocks(); localStorage.clear(); jest.spyOn(window, 'confirm').mockReturnValue(true); api.get.mockResolvedValue([]); });
afterEach(() => jest.restoreAllMocks());

test('banner typing, upload and placement submit real text values; failed save retains the editor', async () => {
  api.post.mockRejectedValueOnce(new Error('Banner save failed')).mockResolvedValueOnce({ _id: 'banner' });
  render(<Banners />);
  fireEvent.click(screen.getByRole('button', { name: 'Add New Banner' }));
  fireEvent.change(screen.getByLabelText('Banner Title'), { target: { value: 'Festive edit' } });
  fireEvent.change(screen.getByLabelText('Subtitle'), { target: { value: 'Elegant festive styles' } });
  fireEvent.change(screen.getByLabelText('CTA Label'), { target: { value: 'Shop festive' } });
  fireEvent.change(screen.getByLabelText('Redirect Link'), { target: { value: '/products' } });
  fireEvent.change(screen.getByLabelText('Display Order'), { target: { value: '2' } });
  fireEvent.click(screen.getByRole('button', { name: 'Upload photo' }));
  fireEvent.click(screen.getAllByRole('button', { name: 'Add New Banner' }).at(-1));
  await screen.findByText('Banner save failed');
  expect(screen.getByLabelText('Banner Title')).toHaveValue('Festive edit');
  fireEvent.click(screen.getAllByRole('button', { name: 'Add New Banner' }).at(-1));
  await waitFor(() => expect(api.post).toHaveBeenLastCalledWith('/admin/banners', expect.objectContaining({ title: 'Festive edit', subtitle: 'Elegant festive styles', buttonText: 'Shop festive', link: '/products', displayOrder: 2, image: 'https://media.example/photo.jpg' })));
  await waitFor(() => expect(screen.queryByLabelText('Banner Title')).not.toBeInTheDocument());
});
test('category manager retries reads and keeps the category when archive fails', async () => {
  let firstList = true;
  let archived = false;
  api.get.mockImplementation(async path => {
    if (path.includes('/impact')) return { productCount: 2, activeProductCount: 1, draftCount: 0, couponCount: 0, childCount: 0, canDelete: false };
    if (firstList) { firstList = false; throw new Error('Categories offline'); }
    return [{ ...category, slug: 'sarees', isArchived: archived }];
  });
  api.patch.mockRejectedValueOnce(new Error('Category archive failed')).mockImplementationOnce(async () => { archived = true; return { message: 'Category archived' }; });
  render(<Categories />);
  fireEvent.click(await screen.findByRole('button', { name: 'Retry categories' }));
  expect(await screen.findByText('Sarees')).toBeInTheDocument();
  expect(api.get).toHaveBeenLastCalledWith('/admin/categories?admin=true&archive=all');
  fireEvent.click(screen.getByRole('button', { name: 'Archive' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Archive category' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Category archive failed');
  expect(screen.getAllByText('Sarees').length).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole('button', { name: 'Archive category' }));
  await waitFor(() => expect(api.patch).toHaveBeenCalledTimes(2));
  expect(await screen.findByRole('button', { name: /Restore/ })).toBeInTheDocument();
});
test('category editor creates a normalized child category from the list-first drawer', async () => {
  const parentCategory = { _id: 'parent', name: 'Clothing', slug: 'clothing', isActive: true, isArchived: false, level: 0 };
  api.get.mockImplementation(async path => path === '/catalog-configuration'
    ? { categoryDefinitions: [{ key: 'sarees', name: 'Sarees', active: true }] }
    : [parentCategory]);
  api.post.mockResolvedValue({ _id: 'child', name: 'Festive Sarees', slug: 'festive-sarees', parent: 'parent', isActive: true });
  render(<Categories />);
  fireEvent.click(await screen.findByRole('button', { name: 'Add category' }));
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Festive Sarees' } });
  expect(screen.getByLabelText('Slug')).toHaveValue('festive-sarees');
  fireEvent.change(screen.getByLabelText('Parent category'), { target: { value: 'parent' } });
  await screen.findByRole('option', { name: 'Sarees' });
  fireEvent.change(screen.getByLabelText('Product field template'), { target: { value: 'sarees' } });
  fireEvent.click(screen.getByRole('button', { name: 'Add Category' }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/admin/categories', expect.objectContaining({ name: 'Festive Sarees', slug: 'festive-sarees', parent: 'parent', definitionKey: 'sarees' })));
  expect(await screen.findByRole('status')).toHaveTextContent('Category added successfully');
});
test('coupon pause preserves redeemed history and delete archives a used coupon', async () => {
  const coupon = { _id: 'coupon', code: 'FESTIVE', discountType: 'percentage', discountValue: 10, isActive: true, usedCount: 2 };
  api.get.mockImplementation(async path => path.includes('/coupons') ? [coupon] : path.includes('/categories') ? [category] : []);
  api.put.mockResolvedValue({ ...coupon, isActive: false });
  api.delete.mockResolvedValue({ archived: true, coupon: { ...coupon, isActive: false, isArchived: true } });
  render(<Coupons />);
  fireEvent.click(await screen.findByRole('button', { name: 'Pause' }));
  expect(await screen.findByRole('button', { name: 'Activate' })).toBeInTheDocument();
  expect(api.put).toHaveBeenCalledWith('/admin/coupons/coupon', { isActive: false });
  fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
  fireEvent.click(screen.getByRole('button', { name: 'Archive' }));
  await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/admin/coupons/coupon'));
  expect(await screen.findByText('FESTIVE')).toBeInTheDocument();
});
test('review moderation keeps failed visibility changes and removes only after deletion is acknowledged', async () => {
  const review = { _id: 'review', product: { name: 'Rose saree' }, user: { name: 'Asha' }, rating: 5, comment: 'Beautiful fabric', isVisible: true, createdAt: '2026-09-01' };
  api.get.mockResolvedValue([review]);
  api.patch.mockRejectedValueOnce(new Error('Moderation failed')).mockResolvedValueOnce({ ...review, isVisible: false }).mockResolvedValueOnce(review);
  api.delete.mockResolvedValue({});
  render(<Reviews />);
  fireEvent.click(await screen.findByRole('button', { name: 'Hide' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Moderation failed');
  fireEvent.click(screen.getByRole('button', { name: 'Hide' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Show' }));
  await waitFor(() => expect(api.patch).toHaveBeenCalledTimes(3));
  fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));
  fireEvent.click(screen.getAllByRole('button', { name: 'Delete' }).at(-1));
  await waitFor(() => expect(screen.queryByText('Beautiful fabric')).not.toBeInTheDocument());
});
test('review read failures show a retry instead of an empty inbox and retry clears the error', async () => {
  api.get.mockRejectedValueOnce(new Error('Reviews unavailable')).mockResolvedValueOnce([{ _id: 'review', product: { name: 'Silk saree' }, rating: 5, isVisible: true, createdAt: '2026-09-01' }]);
  render(<Reviews />);
  await screen.findByText('Reviews unavailable');
  expect(screen.queryByText('No reviews found')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('Silk saree')).toBeInTheDocument();
  expect(screen.queryByText('Reviews unavailable')).not.toBeInTheDocument();
});
test('support status is serialized and changes only after the API acknowledges it', async () => {
  api.get.mockResolvedValue([{ _id: 'message', name: 'Asha', email: 'asha@example.test', message: 'Where is my order?', status: 'NEW' }]);
  let reject;
  api.put.mockImplementationOnce(() => new Promise((_resolve, fail) => { reject = fail; })).mockResolvedValueOnce({});
  render(<Support />);
  const status = await screen.findByRole('combobox', { name: 'Status for Asha' });
  fireEvent.change(status, { target: { value: 'READ' } });
  expect(status).toBeDisabled();
  expect(status).toHaveValue('NEW');
  await act(async () => { reject(new Error('Update failed')); });
  expect(await screen.findByRole('alert')).toHaveTextContent('Update failed');
  fireEvent.change(status, { target: { value: 'READ' } });
  await waitFor(() => expect(status).toHaveValue('READ'));
});
test('subscriber loading retries then search distinguishes active and unsubscribed records', async () => {
  api.get.mockRejectedValueOnce(new Error('Subscribers offline')).mockResolvedValueOnce([{ _id: 'a', email: 'asha@example.test', isActive: true }, { _id: 'b', email: 'meera@example.test', isActive: false }]);
  render(<Subscribers />);
  fireEvent.click(await screen.findByRole('button', { name: 'Retry subscribers' }));
  await screen.findByText('asha@example.test');
  fireEvent.change(screen.getByPlaceholderText('Search email'), { target: { value: 'meera' } });
  expect(screen.queryByText('asha@example.test')).not.toBeInTheDocument();
  expect(screen.getByText('Unsubscribed')).toBeInTheDocument();
});
test('dashboard read failures retry and legacy responses never appear as current period data', async () => {
  api.get.mockRejectedValueOnce(new Error('Dashboard offline')).mockResolvedValueOnce({ stats: { orders: { value: 12 } } });
  render(<Dashboard />);
  fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('The dashboard API is out of date. Restart or update the backend, then refresh this page.')).toBeInTheDocument();
  expect(screen.queryByText('12')).not.toBeInTheDocument();
  expect(screen.queryByText('Live data connected')).not.toBeInTheDocument();
});
test('customer workspace opens a store-scoped 360 profile and saves internal notes', async () => {
  const row = { userId: '64b000000000000000000001', name: 'Asha', phoneMasked: '••••0001', orders: 2, paidOrders: 2, netSpend: 1800, aov: 900, returns: 0, rtoCount: 0, returnRate: 0, rtoRate: 0, tags: ['Repeat Customer'] };
  api.get.mockImplementation(async path => path.startsWith('/admin/customer-crm?') ? { items: [row], total: 1, page: 1, totalPages: 1, summary: { total: 1, repeat: 1, netRevenue: 1800 }, segments: ['All customers', 'Repeat Customer'], rules: {}, capabilities: { canWrite: true, canViewPii: true, canExport: true, canMarket: true, canManageRules: true } } : path === `/admin/customer-crm/${row.userId}` ? { customer: { id: row.userId, name: 'Asha', phone: '9000000001' }, metrics: row, profile: { revision: 0, manualTags: [], notes: '', channelConsents: {}, restrictions: {} }, orders: [], returns: [], conversations: [], notifications: [], insights: {}, capabilities: { canWrite: true } } : []);
  api.put.mockResolvedValue({ revision: 1 });
  render(<Customers />);
  fireEvent.click(await screen.findByRole('button', { name: 'View' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Profile' }));
  fireEvent.change(screen.getByLabelText('Internal notes'), { target: { value: 'Prefers evening delivery' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
  await waitFor(() => expect(api.put).toHaveBeenCalledWith(`/admin/customer-crm/${row.userId}`, expect.objectContaining({ notes: 'Prefers evening delivery', revision: 0 })));
});
test('seller product editing uses seller endpoints and never restores an admin creation draft', async () => {
  localStorage.setItem('samira-admin-product-draft:new', JSON.stringify({ name: 'Private admin draft' }));
  api.get.mockImplementation(async path => path === '/catalog-configuration' ? { features: { sizing: false }, attributes: [] } : path.includes('/categories') ? [category] : path === '/seller/products/product' ? { _id: 'product', name: 'Seller silk saree', sku: 'SL-1', category: 'cat', price: 900, originalPrice: 1100, stock: 3, description: 'Soft silk saree with a refined woven finish.', images: [{ url: 'https://media.example/saree.jpg' }], sizes: [], colors: [], tags: [] } : []);
  api.put.mockResolvedValue({});
  const view = render(<ProductForm apiPrefix="/seller" uploadPrefix="/seller/uploads" cancelPath="/seller/products" />);
  await screen.findByRole('button', { name: 'Add Product' });
  expect(screen.queryByDisplayValue('Private admin draft')).not.toBeInTheDocument();
  view.unmount();
  render(<ProductForm mode="Update" productId="product" apiPrefix="/seller" uploadPrefix="/seller/uploads" cancelPath="/seller/products" />);
  await screen.findByDisplayValue('Seller silk saree');
  expect(screen.getByRole('button', { name: 'Upload photo /seller/uploads' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Update Product' }));
  await waitFor(() => expect(api.put).toHaveBeenCalledWith('/seller/products/product', expect.objectContaining({ name: 'Seller silk saree', stock: 3 })));
  expect(api.post).not.toHaveBeenCalled();
});
test('caption is editable and clipboard denial offers a manual fallback instead of an unhandled rejection', async () => {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: jest.fn().mockRejectedValue(new Error('Denied')) } });
  render(<ProductCaptionModal open product={{ name: 'Rose saree', price: 999, sizes: [], colors: [] }} />);
  const caption = screen.getByRole('textbox', { name: 'Product caption' });
  fireEvent.change(caption, { target: { value: 'My reviewed caption' } });
  fireEvent.click(screen.getByRole('button', { name: 'Copy caption' }));
  expect(await screen.findByRole('status')).toHaveTextContent('copy it manually');
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith('My reviewed caption');
  expect(caption).toHaveValue('My reviewed caption');
});

test('optional store settings failure does not hide a successfully loaded product catalog', async () => {
  api.get.mockImplementation(async path => {
    if (path === '/settings') throw new Error('Settings temporarily unavailable');
    if (path.includes('/categories')) return [category];
    return [{ _id: 'product', name: 'Visible silk saree', stock: 5, price: 999, isActive: true, images: [], category }];
  });
  render(<Products />);
  expect(await screen.findByText('Visible silk saree')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Edit Visible silk saree' })).toBeEnabled();
  expect(screen.queryByText('Settings temporarily unavailable')).not.toBeInTheDocument();
});

test('catalog bulk actions send only the selected products and refresh the server-backed list', async () => {
  const product = { _id: 'product-1', name: 'Festive silk saree', sku: 'FEST-1', stock: 6, lowStockAlert: 2, price: 1299, isActive: true, images: [], category };
  api.get.mockImplementation(async path => {
    if (path.startsWith('/admin/products?')) return { items: [product], total: 1, totalPages: 1, summary: { total: 1, active: 1, low: 0, out: 0, archived: 0, retailValue: 7794, costValue: 0 } };
    if (path.includes('/categories')) return [category];
    if (path === '/settings') return {};
    return [];
  });
  api.post.mockResolvedValue({ count: 1, message: '1 product updated' });
  render(<Products />);
  fireEvent.click(await screen.findByRole('button', { name: 'Select Festive silk saree' }));
  fireEvent.change(screen.getByRole('combobox', { name: 'Bulk action' }), { target: { value: 'best-seller' } });
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/admin/products/bulk', { ids: ['product-1'], action: 'best-seller' }));
  await waitFor(() => expect(api.get.mock.calls.filter(([path]) => path.startsWith('/admin/products?')).length).toBeGreaterThan(1));
});

test('required catalog failures show retry rather than an empty successful catalog', async () => {
  api.get.mockImplementation(async path => {
    if (path.includes('/products')) throw new Error('Catalog unavailable');
    return [category];
  });
  render(<Products />);
  await screen.findByText('Catalog unavailable');
  expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  expect(screen.queryByText('No products found')).not.toBeInTheDocument();
});
