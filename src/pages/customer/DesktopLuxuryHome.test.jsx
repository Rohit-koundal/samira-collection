import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import DesktopLuxuryHome from './DesktopLuxuryHome';
import api from '../../services/api';

jest.mock('../../context/CartContext', () => ({
  useCart: () => ({ addToCart: jest.fn() }),
}));

jest.mock('../../context/WishlistContext', () => ({
  useWishlist: () => ({ items: [], toggleWishlist: jest.fn() }),
}));

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

describe('desktop home workflows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows a useful empty collection state instead of a blank section', () => {
    render(<DesktopLuxuryHome navigate={jest.fn()} />);

    expect(screen.getByText(/No accessories are published yet/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Browse all products/i }).length).toBeGreaterThan(0);
  });

  test('submits the homepage newsletter to the backend', async () => {
    api.post.mockResolvedValue({ message: 'Thanks for subscribing.' });
    render(<DesktopLuxuryHome navigate={jest.fn()} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Email address' }), {
      target: { value: 'style@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Subscribe' }));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/newsletter/subscribe', {
      email: 'style@example.com',
      source: 'homepage',
    }));
    expect(await screen.findByText('Thanks for subscribing.')).toBeInTheDocument();
  });
});
