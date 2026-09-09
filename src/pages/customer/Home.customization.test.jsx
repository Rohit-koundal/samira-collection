import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import Home from './Home';
import { mergeWebsiteConfig } from '../../config/websiteCustomization';

let mockWidth = 390;
let mockConfig = mergeWebsiteConfig();
let mockProduct;
const mockDesktopModuleLoaded = jest.fn();
jest.mock('@mantine/hooks', () => ({ useMediaQuery: (query) => mockWidth >= (query.includes('1024') ? 1024 : 768) }));
jest.mock('../../context/WebsiteCustomizationContext', () => ({ useWebsiteCustomization: () => ({ config: mockConfig }) }));
jest.mock('../../context/CartContext', () => ({ useCart: () => ({ getCartItem: jest.fn(), addToCart: jest.fn() }) }));
jest.mock('../../context/WishlistContext', () => ({ useWishlist: () => ({ items: [], toggleWishlist: jest.fn() }) }));
jest.mock('./DesktopLuxuryHome', () => {
  mockDesktopModuleLoaded();
  return ({ industry, websiteConfig }) => <div data-testid="desktop-home" data-industry={industry} data-ethnic-visible={String(websiteConfig.homepage.sections.find((section) => section.id === 'ethnicSets')?.visible)}>Desktop home layout</div>;
});
jest.mock('../../store/apiSlice', () => ({
  useGetProductsQuery: () => ({ data: [mockProduct] }),
  useGetCategoriesQuery: () => ({ data: [] }),
  useGetBannersQuery: () => ({ data: [] }),
  useGetFeaturedReviewsQuery: () => ({ data: [] }),
}));

beforeEach(() => { mockWidth = 390; mockConfig = mergeWebsiteConfig(); mockProduct = { _id: '0123456789abcdef01234567', name: 'API product', price: 100, images: ['/uploads/item.png'], showOnHomepage: true, isFeatured: true, category: 'Kurtis' }; });

test('mobile rails calculate discounts from actual prices and disable unavailable purchases', () => {
  mockProduct = { ...mockProduct, price: 1599, originalPrice: 2399, discountPercentage: 0, stock: 0 };
  render(<Home navigate={jest.fn()} />);
  expect(screen.getAllByText(/33% OFF/).length).toBeGreaterThan(0);
  expect(screen.queryByText(/0% OFF/)).not.toBeInTheDocument();
  screen.getAllByRole('button', { name: /Out of stock/i }).forEach(button => expect(button).toBeDisabled());
});

test('the wishlist keyboard action does not also open the product card', () => {
  const navigate = jest.fn();
  const { container } = render(<Home navigate={navigate} />);
  const button = container.querySelector('[data-mobile-product-card] button[aria-label="Add to wishlist"]');
  fireEvent.keyDown(button, { key: 'Enter' });
  expect(navigate).not.toHaveBeenCalled();
});

test('desktop edits do not change the current mobile composition while overrides are disabled', () => {
  mockConfig = mergeWebsiteConfig({ homepage: { sections: [{ id: 'hero', visible: false, heading: 'Desktop-only text' }] },
    mobile: { enabled: false, sections: [{ id: 'hero', visible: false, heading: 'Inactive mobile text' }] } });
  const { container } = render(<Home navigate={jest.fn()} />);
  expect(screen.getByText('Celebrate in Style')).toBeInTheDocument();
  expect(screen.queryByText('Desktop home layout')).not.toBeInTheDocument();
  expect(mockDesktopModuleLoaded).not.toHaveBeenCalled();
  expect(container.querySelector('.mobile-home--custom')).toBeNull();
  expect(container.querySelector('[data-mobile-product-card] [data-mobile-product-media]')).not.toBeNull();
});

test('enabled mobile sections can hide the hero and change only mobile headings', () => {
  mockConfig = mergeWebsiteConfig({ mobile: { enabled: true, sections: [
    { id: 'hero', visible: false }, { id: 'trending', heading: 'Mobile edit', order: 0 },
  ] } });
  const { container } = render(<Home navigate={jest.fn()} />);
  expect(screen.queryByText('Celebrate in Style')).not.toBeInTheDocument();
  expect(screen.getByText('Mobile edit')).toBeInTheDocument();
  expect(container.querySelector('.mobile-home--custom')).not.toBeNull();
});

test('a non-fashion store uses its industry sections on mobile without fashion-only rails', () => {
  render(<Home navigate={jest.fn()} industry="electronics" industrySections={['hero', 'categories', 'featured', 'bestSellers', 'offers']} />);
  expect(screen.getByText('New electronics collection')).toBeInTheDocument();
  expect(screen.getByText('Featured')).toBeInTheDocument();
  expect(screen.getByText('Best Sellers')).toBeInTheDocument();
  expect(screen.queryByText('Ethnic Sets')).not.toBeInTheDocument();
  expect(screen.queryByText('Accessories')).not.toBeInTheDocument();
});

test('a non-fashion desktop store receives the same industry visibility rules', async () => {
  mockWidth = 1440;
  render(<Home navigate={jest.fn()} industry="electronics" industrySections={['hero', 'categories', 'featured', 'bestSellers', 'offers']} />);
  const desktop = await screen.findByTestId('desktop-home');
  expect(desktop).toHaveAttribute('data-industry', 'electronics');
  expect(desktop).toHaveAttribute('data-ethnic-visible', 'false');
});

test('mobile settings never render a second layout on desktop or affect tablet section content', async () => {
  mockConfig = mergeWebsiteConfig({ mobile: { enabled: true, sections: [{ id: 'hero', heading: 'Mobile only' }] } });
  mockWidth = 1440;
  const { rerender } = render(<Home navigate={jest.fn()} />);
  expect(await screen.findByText('Desktop home layout')).toBeInTheDocument();
  expect(screen.queryByText('Mobile only')).not.toBeInTheDocument();
  mockWidth = 820;
  rerender(<Home navigate={jest.fn()} />);
  expect(screen.queryByText('Desktop home layout')).not.toBeInTheDocument();
  expect(screen.getByText('Celebrate in Style')).toBeInTheDocument();
  expect(screen.queryByText('Mobile only')).not.toBeInTheDocument();
});
