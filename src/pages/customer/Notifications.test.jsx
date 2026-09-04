import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import api from '../../services/api';
import Notifications from './Notifications';

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    patch: jest.fn(),
  },
}));

describe('customer notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('loads notifications, records a read receipt, and opens the related order', async () => {
    const navigate = jest.fn();
    const notification = {
      _id: 'notification-1',
      title: 'Order shipped',
      message: 'Your order is on the way.',
      createdAt: '2026-09-04T08:00:00.000Z',
      metadata: { orderId: 'order-1' },
    };
    api.get.mockResolvedValue([notification]);
    api.patch.mockResolvedValue({ ...notification, readAt: '2026-09-04T08:05:00.000Z' });

    render(<Notifications navigate={navigate} />);

    expect(await screen.findByText('Order shipped')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Order shipped/i }));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/notifications/notification-1/read', {});
      expect(navigate).toHaveBeenCalledWith('/order-detail?id=order-1');
    });
  });

  test('shows a useful empty state', async () => {
    api.get.mockResolvedValue([]);

    render(<Notifications navigate={jest.fn()} />);

    expect(await screen.findByRole('heading', { name: 'No notifications yet' })).toBeInTheDocument();
    expect(screen.getByText('Order and return updates will appear here.')).toBeInTheDocument();
  });
});
