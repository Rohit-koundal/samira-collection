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
jest.mock('../../services/api', () => ({ get: jest.fn(), put: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() }));
jest.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: { name: 'Owner', systemRole: 'MASTER_OWNER' } }) }));
jest.mock('../../components/admin/ImageUploader', () => ({ onChange, uploadPath }) => <button type="button" onClick={() => onChange([{ url: 'https://media.example/photo.jpg' }])}>Upload photo {uploadPath}</button>);
jest.mock('../../components/admin/VideoUploader', () => () => null);
const category = { _id: 'cat', name: 'Sarees', isActive: false };
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
test('categories load failures retry authenticated data and failed delete retains an inactive category', async () => {
  api.get.mockRejectedValueOnce(new Error('Categories offline')).mockResolvedValue([category]);
  api.delete.mockRejectedValueOnce(new Error('Category has products')).mockResolvedValueOnce({});
  render(<Categories />);
  fireEvent.click(await screen.findByRole('button', { name: 'Retry categories' }));
  expect(await screen.findByText('Sarees', { selector: 'td' })).toBeInTheDocument();
  expect(api.get).toHaveBeenLastCalledWith('/admin/categories?admin=true');
  fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Category has products');
  expect(screen.getByText('Sarees', { selector: 'td' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
  await waitFor(() => expect(screen.queryByText('Sarees', { selector: 'td' })).not.toBeInTheDocument());
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
test('dashboard read failure never presents zero totals as a successful report and can retry', async () => {
  api.get.mockRejectedValueOnce(new Error('Dashboard offline')).mockResolvedValueOnce({ stats: { orders: { value: 12 } } });
  render(<Dashboard />);
  fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('12')).toBeInTheDocument();
  expect(screen.getByText('Live data connected')).toBeInTheDocument();
});
test('customer promotion requires confirmation and failed block retains the customer', async () => {
  const customer = { _id: 'customer', name: 'Asha', role: 'customer', phone: '9000000001', createdAt: '2026-09-01' };
  api.get.mockResolvedValue([customer]);
  api.patch.mockRejectedValueOnce(new Error('Blocking failed')).mockResolvedValueOnce({});
  render(<Customers />);
  fireEvent.click(await screen.findByRole('button', { name: 'Block' }));
  expect(await screen.findByText('Blocking failed')).toBeInTheDocument();
  window.confirm.mockReturnValue(false);
  fireEvent.click(screen.getByRole('button', { name: 'Promote' }));
  expect(api.patch).toHaveBeenCalledTimes(1);
  window.confirm.mockReturnValue(true);
  fireEvent.click(screen.getByRole('button', { name: 'Promote' }));
  await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/admin/customers/customer/promote-admin', {}));
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
