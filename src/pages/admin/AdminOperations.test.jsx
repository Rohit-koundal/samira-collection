import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import Inventory from './Inventory';
import Orders from './Orders';
import OrderDetail from './OrderDetail';
import api from '../../services/api';

jest.mock('../../services/api', () => ({ get: jest.fn(), post: jest.fn(), patch: jest.fn(), put: jest.fn(), delete: jest.fn() }));
jest.mock('../../components/order/Receipt', () => () => null);
jest.mock('../../components/order/ReceiptActions', () => () => null);
const product = { _id: 'product-1', name: 'Rose kurta', stock: 8, variants: [], isActive: true };
const order = { _id: 'order12345678', orderStatus: 'Pending', paymentStatus: 'Pending', paymentMethod: 'COD', finalAmount: 1299, createdAt: '2026-09-06T00:00:00Z', orderItems: [{ product: 'p', name: 'Rose kurta', size: 'M', color: 'Pink', quantity: 1, price: 1299 }] };
beforeEach(() => jest.clearAllMocks());

test('inventory typing saves one completed quantity and rejects blank or fractional stock', async () => {
  api.get.mockResolvedValue([product]);
  api.patch.mockImplementation(async (_path, body) => ({ ...product, stock: body.stock }));
  render(<Inventory />);
  const input = await screen.findByRole('spinbutton', { name: 'Rose kurta stock' });
  fireEvent.change(input, { target: { value: '' } });
  fireEvent.change(input, { target: { value: '1' } });
  fireEvent.change(input, { target: { value: '120' } });
  expect(api.patch).not.toHaveBeenCalled();
  fireEvent.blur(input);
  await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/admin/products/product-1/stock', { stock: 120 }));
  await waitFor(() => expect(input).toBeEnabled());
  expect(api.get.mock.calls.filter(([path]) => path === '/admin/products?admin=true')).toHaveLength(1);
  expect(api.get.mock.calls.filter(([path]) => path === '/admin/inventory/history?limit=30')).toHaveLength(2);
  for (const invalid of ['', '1.5', '-2']) {
    fireEvent.change(input, { target: { value: invalid } });
    fireEvent.blur(input);
    expect(screen.getByRole('alert')).toHaveTextContent('whole stock quantity');
  }
  expect(api.patch).toHaveBeenCalledTimes(1);
});

test('failed stock saves leave actual inventory intact and allow a single retry', async () => {
  api.get.mockResolvedValue([product]);
  let rejectSave;
  api.patch.mockImplementationOnce(() => new Promise((_resolve, reject) => { rejectSave = reject; }));
  render(<Inventory />);
  const input = await screen.findByRole('spinbutton', { name: 'Rose kurta stock' });
  fireEvent.change(input, { target: { value: '12' } });
  fireEvent.keyDown(input, { key: 'Enter' });
  fireEvent.blur(input);
  expect(api.patch).toHaveBeenCalledTimes(1);
  await act(async () => { rejectSave(new Error('Stock update failed')); });
  expect(screen.getByRole('alert')).toHaveTextContent('Stock update failed');
  expect(screen.getByText('8', { selector: 'td' })).toBeInTheDocument();
  expect(input).toHaveValue(12);
  api.patch.mockResolvedValueOnce({ ...product, stock: 12 });
  fireEvent.keyDown(input, { key: 'Enter' });
  await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  expect(api.patch).toHaveBeenCalledTimes(2);
});

test('variant stock writes target the chosen size and update the returned total', async () => {
  const variants = [{ _id: 'variant-1', size: 'M', color: 'Pink', stock: 3 }, { _id: 'variant-2', size: 'L', color: 'Pink', stock: 5 }];
  api.get.mockResolvedValue([{ ...product, variants }]);
  api.patch.mockResolvedValue({ ...product, stock: 15, variants: [{ ...variants[0], stock: 10 }, variants[1]] });
  render(<Inventory />);
  const input = await screen.findByRole('spinbutton', { name: 'Rose kurta M Pink stock' });
  fireEvent.change(input, { target: { value: '10' } });
  fireEvent.blur(input);
  await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/admin/products/product-1/stock', { stock: 10, variantId: 'variant-1' }));
  expect(await screen.findByText('15', { selector: 'td' })).toBeInTheDocument();
  expect(screen.getByRole('spinbutton', { name: 'Rose kurta L Pink stock' })).toHaveValue(5);
});

test('cancelling an order keeps the server-confirmed record in order history', async () => {
  let current = order;
  api.get.mockImplementation(async path => path.includes('workspace-summary') ? {} : [current]);
  api.put.mockImplementation(async () => { current = { ...current, orderStatus: 'Cancelled', revision: 1, allowedActions: [] }; return current; });
  render(<Orders />);
  fireEvent.click(await screen.findByRole('button', { name: 'Cancel order', exact: true }));
  const dialog = screen.getByRole('dialog');
  fireEvent.change(within(dialog).getByLabelText('Cancellation reason'), { target: { value: 'Customer requested cancellation' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel order', exact: true }));
  await waitFor(() => expect(screen.queryByRole('heading', { name: 'Cancel this order?' })).not.toBeInTheDocument());
  expect(api.put).toHaveBeenCalledWith('/admin/orders/order12345678/status', expect.objectContaining({ orderStatus: 'Cancelled', revision: 0, note: 'Customer requested cancellation' }));
  const row = screen.getByRole('row', { name: /12345678/ });
  expect(within(row).getByText('Cancelled', { selector: 'span' })).toBeInTheDocument();
  expect(within(row).queryByRole('button', { name: 'Cancel order', exact: true })).not.toBeInTheDocument();
  expect(screen.getByText('1 record')).toBeInTheDocument();
});

test('selected booked shipments can request pickup once through the bulk toolbar', async () => {
  const ready = { ...order, allowedActions: [], shipment: { provider: 'delhivery', status: 'READY_TO_SHIP', bookingState: 'BOOKED', awb: 'AWB-1', labelAvailable: true, pickup: {} } };
  api.get.mockImplementation(async path => path.includes('workspace-summary') ? {} : { items: [ready], page: 1, limit: 25, total: 1, totalPages: 1 });
  api.post.mockResolvedValue({ shipment: { ...ready.shipment, status: 'PICKUP_SCHEDULED' } });
  render(<Orders />);

  fireEvent.click(await screen.findByRole('checkbox', { name: /Select/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Request pickup (1)' }));
  const dialog = screen.getByRole('dialog');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Request pickups' }));

  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/admin/orders/order12345678/delivery/pickup', expect.objectContaining({ date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/), time: '10:00', closeTime: '18:00' })));
  expect(await screen.findByRole('status')).toHaveTextContent('pickup request confirmed');
});

test('shipment validation failures preserve order controls and entered tracking for retry', async () => {
  const confirmed = { ...order, orderStatus: 'Confirmed', allowedActions: ['MARK_PACKED', 'CANCEL_ORDER'] };
  api.get.mockImplementation(async path => path.endsWith('/receipt') ? null : confirmed);
  api.put.mockRejectedValueOnce(new Error('Tracking URL must use HTTPS')).mockResolvedValueOnce({ ...order, shipment: {} });
  render(<OrderDetail route={'/admin/orders/detail?id=' + order._id} />);
  const tracking = await screen.findByPlaceholderText('AWB / tracking number');
  fireEvent.change(tracking, { target: { value: 'AWB123' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save manual shipment' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Tracking URL');
  expect(tracking).toHaveValue('AWB123');
  expect(screen.getByRole('heading', { name: 'Ordered items' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Save manual shipment' }));
  await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  expect(api.put).toHaveBeenCalledTimes(2);
});

test('late order and invoice reads cannot replace a newly selected order', async () => {
  const oldReads = [];
  const next = { ...order, _id: 'next12345678', orderItems: [{ ...order.orderItems[0], name: 'Current green saree' }] };
  api.get.mockImplementation(path => path.includes(order._id) ? new Promise(resolve => oldReads.push(resolve)) : Promise.resolve(path.endsWith('/receipt') ? null : next));
  const view = render(<OrderDetail route={'/admin/orders/detail?id=' + order._id} />);
  view.rerender(<OrderDetail route={'/admin/orders/detail?id=' + next._id} />);
  await screen.findByText('Current green saree');
  await act(async () => { oldReads.forEach(resolve => resolve(order)); });
  expect(screen.queryByText('Rose kurta')).not.toBeInTheDocument();
  expect(screen.getByText('Current green saree')).toBeInTheDocument();
});

test('invoice fetch errors remain retryable without blocking order controls', async () => {
  let failReceipt = true;
  api.get.mockImplementation(async path => {
    if (path.endsWith('/receipt')) { if (failReceipt) throw new Error('Invoice unavailable'); return null; }
    return order;
  });
  render(<OrderDetail route={'/admin/orders/detail?id=' + order._id} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Retry invoice' }));
  expect(screen.getByRole('button', { name: 'Confirm order' })).toBeEnabled();
  failReceipt = false;
  fireEvent.click(await screen.findByRole('button', { name: 'Retry invoice' }));
  await waitFor(() => expect(screen.queryByText('Invoice unavailable')).not.toBeInTheDocument());
});

test('a completed COD return records an audited refund amount from order detail', async () => {
  const refundable = {
    ...order,
    orderStatus: 'Delivered',
    paymentStatus: 'Paid',
    paymentState: 'PAID',
    refundedAmount: 300,
    revision: 4,
    allowedActions: ['RECORD_COD_REFUND'],
  };
  api.get.mockImplementation(async path => path.endsWith('/receipt') ? null : refundable);
  api.put.mockResolvedValue({ ...refundable, paymentStatus: 'Refunded', paymentState: 'REFUNDED', refundedAmount: 1299, revision: 5, allowedActions: [] });
  render(<OrderDetail route={'/admin/orders/detail?id=' + order._id} />);

  fireEvent.click(await screen.findByRole('button', { name: 'Record refund' }));
  const dialog = screen.getByRole('dialog');
  expect(within(dialog).getByLabelText('Refund amount')).toHaveValue(999);
  fireEvent.change(within(dialog).getByLabelText('Receipt/reference (optional)'), { target: { value: 'cash-refund-final' } });
  fireEvent.change(within(dialog).getByLabelText('Refund note'), { target: { value: 'Remaining cash refund paid to customer' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Record refund' }));

  await waitFor(() => expect(api.put).toHaveBeenCalledWith('/admin/orders/order12345678/payment-status', {
    paymentStatus: 'Refunded',
    amount: 999,
    revision: 4,
    reference: 'cash-refund-final',
    note: 'Remaining cash refund paid to customer',
  }));
});

test('delivery exceptions expose a focused staff follow-up without changing carrier status', async () => {
  const exceptionOrder = { ...order, orderStatus: 'Shipped', allowedActions: ['RESOLVE_DELIVERY_EXCEPTION'], shipment: { _id: 'shipment-1', provider: 'delhivery', courierName: 'Delhivery', status: 'EXCEPTION', bookingState: 'BOOKED', awb: 'AWB-1' } };
  const delivery = { shipment: { ...exceptionOrder.shipment, exceptionActions: [] }, readiness: { configured: true, liveBooking: true, name: 'delhivery', label: 'Delhivery' } };
  api.get.mockImplementation(async path => path.endsWith('/receipt') ? null : path.endsWith('/delivery') ? delivery : exceptionOrder);
  api.post.mockResolvedValue({ shipment: delivery.shipment });
  render(<OrderDetail route={'/admin/orders/detail?id=' + order._id} />);

  fireEvent.click(await screen.findByRole('button', { name: 'Resolve delivery issue' }));
  fireEvent.change(await screen.findByLabelText('Follow-up'), { target: { value: 'REQUESTED_REDELIVERY' } });
  fireEvent.change(screen.getByLabelText('Courier reference (optional)'), { target: { value: 'NDR-22' } });
  fireEvent.change(screen.getByLabelText('Action note'), { target: { value: 'Customer confirmed delivery availability.' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save follow-up' }));

  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/admin/orders/order12345678/delivery/exception', expect.objectContaining({ action: 'REQUESTED_REDELIVERY', reference: 'NDR-22', note: 'Customer confirmed delivery availability.' })));
  expect(screen.getByText('Exception')).toBeInTheDocument();
});

test('order mutations are serialized and late old failures cannot affect another order', async () => {
  const next = { ...order, _id: 'next12345678' };
  api.get.mockImplementation(async path => path.endsWith('/receipt') ? null : path.includes(next._id) ? next : order);
  let failMutation;
  api.put.mockImplementation(() => new Promise((_resolve, reject) => { failMutation = reject; }));
  const view = render(<OrderDetail route={'/admin/orders/detail?id=' + order._id} />);
  const confirm = await screen.findByRole('button', { name: 'Confirm order' });
  fireEvent.click(confirm);
  fireEvent.click(confirm);
  expect(api.put).toHaveBeenCalledTimes(1);
  expect(confirm).toBeDisabled();
  view.rerender(<OrderDetail route={'/admin/orders/detail?id=' + next._id} />);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Confirm order' })).toBeEnabled());
  await act(async () => { failMutation(new Error('Stale order failure')); });
  expect(screen.queryByText('Stale order failure')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Confirm order' })).toBeEnabled();
});
