import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import DesktopLuxuryHome from './DesktopLuxuryHome';
import api from '../../services/api';
import { mergeWebsiteConfig } from '../../config/websiteCustomization';

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

  test('desktop rails disable out-of-stock purchases and do not invent five-star reviews', () => {
    const product = { _id: 'unavailable', name: 'Silk saree', price: 1599, originalPrice: 2399, stock: 0, images: ['/uploads/item.png'] };
    const { container } = render(<DesktopLuxuryHome navigate={jest.fn()} featuredProducts={[product]} />);
    screen.getAllByRole('button', { name: 'Out of stock' }).forEach(button => expect(button).toBeDisabled());
    expect(container.querySelector('[data-card-field="rating"]')).toBeNull();
    expect(screen.getAllByText('33% OFF').length).toBeGreaterThan(0);
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

  test.each(['trending', 'newArrivals'])('manual %s selection does not get replaced by automatic products', (id) => {
    const config = mergeWebsiteConfig();
    config.homepage.sections = config.homepage.sections.map((section) => ({ ...section, visible: section.id === id }));
    config.homepage.sectionProductIds[id] = ['chosen'];
    const chosen = { id: 'chosen', name: 'Chosen product', images: ['/uploads/chosen.png'], price: 100 };
    const automatic = { id: 'automatic', name: 'Automatic product', images: ['/uploads/automatic.png'], price: 200, showInTrending: true };
    render(<DesktopLuxuryHome websiteConfig={config} navigate={jest.fn()} catalog={[automatic]} trendingProducts={[chosen]} newArrivalProducts={[chosen]} />);
    expect(screen.getByText('Chosen product')).toBeInTheDocument();
    expect(screen.queryByText('Automatic product')).not.toBeInTheDocument();
  });
});
