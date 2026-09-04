import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
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

jest.mock('../../context/CartContext', () => ({
  useCart: () => ({ getCartItem: () => null, addToCart: jest.fn() }),
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
jest.mock('../../components/product/ProductDetailPage', () => () => null);
jest.mock('../../components/seo/SeoHead', () => () => null);
jest.mock('../../utils/analytics', () => ({ trackEvent: jest.fn() }));

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
