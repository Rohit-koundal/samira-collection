import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import ProductDetail from './ProductDetail';

jest.mock('@reduxjs/toolkit/query', () => ({ skipToken: Symbol('skipToken') }));

const mockProduct = {
  _id: 'product-1',
  slug: 'royal-zari-saree',
  name: 'Royal Zari Silk Saree',
  brand: 'Samira Collection',
  description: 'Handwoven zari border from the catalog API.',
  category: { _id: 'category-1', name: 'Sarees' },
  price: 1299,
  originalPrice: 2499,
  discountPercentage: 48,
  sizes: ['S', 'M'],
  colors: ['Navy'],
  stock: 8,
  images: [{ url: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==' }],
  highlights: [],
  fabric: '',
  occasion: '',
  tags: [],
  careInstructions: '',
  returnPolicy: '',
};

jest.mock('../../store/apiSlice', () => ({
  useGetProductQuery: () => ({ data: mockProduct, isLoading: false, error: null }),
  useGetProductsQuery: () => ({ data: [] }),
  useGetReviewsQuery: () => ({ data: [] }),
  useGetSettingsQuery: () => ({ data: { freeShippingMinAmount: 999, returnWindowDays: 7 } }),
  useGetVariantGroupQuery: () => ({ data: null }),
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));

const mockAddConfirmed = jest.fn();
jest.mock('../../context/CartContext', () => ({
  useCart: () => ({ getCartItem: () => null, addToCart: jest.fn(), addToCartConfirmed: (...args) => mockAddConfirmed(...args) }),
}));

jest.mock('../../context/WishlistContext', () => ({
  useWishlist: () => ({ items: [], loading: false, toggleWishlist: jest.fn() }),
}));

const mockApiGet = jest.fn((path) => Promise.resolve(path.endsWith('/summary')
  ? { average: 0, total: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, recommendationPercentage: 0 }
  : null));

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: { get: (...args) => mockApiGet(...args) },
}));

jest.mock('../../components/product/ProductCard', () => ({ ProductVisual: () => null }));
jest.mock('../../components/product/ProductDetailPage', () => ({ onBuyNow, onAddToCart, cartBusy }) => <div data-testid="desktop-purchase-actions"><button disabled={cartBusy} onClick={onBuyNow}>Desktop buy now</button><button disabled={cartBusy} onClick={onAddToCart}>Desktop add to bag</button></div>);
jest.mock('../../components/seo/SeoHead', () => () => null);
jest.mock('../../utils/analytics', () => ({ trackEvent: jest.fn() }));

beforeEach(() => { mockAddConfirmed.mockReset(); });

describe('mobile product details', () => {
  test('shows factual API information without adding generic product claims', async () => {
    render(<ProductDetail navigate={jest.fn()} route="/product?id=product-1" />);

    await waitFor(() => expect(mockApiGet).toHaveBeenCalledWith('/reviews/product-1/summary'));

    expect(screen.getByText('Price details')).toBeInTheDocument();
    expect(screen.getByText('Delivery & services')).toBeInTheDocument();
    expect(screen.getByText('Handwoven zari border from the catalog API.')).toBeInTheDocument();
    expect(screen.getAllByText('7-day return window').length).toBeGreaterThan(0);
    expect(screen.getByText('Maximum retail price')).toBeInTheDocument();
    expect(screen.queryByText('Premium fabric')).not.toBeInTheDocument();
    expect(screen.queryByText('Everyday festive')).not.toBeInTheDocument();
    expect(screen.queryByText('Designer')).not.toBeInTheDocument();
  });
});

describe.each(['mobile', 'desktop'])('%s purchase confirmation', (view) => {
  function buyButton() {
    return view === 'desktop'
      ? within(screen.getByTestId('desktop-purchase-actions')).getByRole('button', { name: 'Desktop buy now' })
      : screen.getAllByRole('button', { name: 'Buy Now', exact: true }).at(-1);
  }
  test('Buy now waits for the saved bag, prevents duplicate clicks and then opens checkout', async () => {
    let resolveAdd;
    mockAddConfirmed.mockReturnValue(new Promise((resolve) => { resolveAdd = resolve; }));
    const navigate = jest.fn();
    render(<ProductDetail navigate={navigate} route="/product?id=product-1" />);
    const button = buyButton();
    fireEvent.click(button); fireEvent.click(button);
    expect(button).toBeDisabled();
    expect(navigate).not.toHaveBeenCalled();
    expect(mockAddConfirmed).toHaveBeenCalledTimes(1);
    expect(mockAddConfirmed).toHaveBeenCalledWith(expect.objectContaining({ _id: 'product-1' }), expect.any(String), 'Navy', '', 1);
    await act(async () => resolveAdd({ ok: true }));
    expect(navigate).toHaveBeenCalledWith('/checkout');
  });

  test('a rejected bag update stays on the product and displays the server error', async () => {
    mockAddConfirmed.mockResolvedValue({ ok: false, message: 'Only 1 item is available. Please update the quantity.' });
    const navigate = jest.fn();
    render(<ProductDetail navigate={navigate} route="/product?id=product-1" />);
    fireEvent.click(buyButton());
    expect((await screen.findAllByText('Only 1 item is available. Please update the quantity.')).length).toBeGreaterThan(0);
    expect(navigate).not.toHaveBeenCalled();
    expect(buyButton()).toBeEnabled();
  });
});

test('a pending Buy now cannot redirect after the customer leaves the product', async () => {
  let resolveAdd;
  mockAddConfirmed.mockReturnValue(new Promise((resolve) => { resolveAdd = resolve; }));
  const navigate = jest.fn();
  const { unmount } = render(<ProductDetail navigate={navigate} route="/product?id=product-1" />);
  fireEvent.click(screen.getByRole('button', { name: 'Desktop buy now' }));
  unmount();
  await act(async () => resolveAdd({ ok: true }));
  expect(navigate).not.toHaveBeenCalled();
});
