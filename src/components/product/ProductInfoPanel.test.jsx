import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import ProductInfoPanel from './ProductInfoPanel';

const baseProps = {
  product: { name: 'Silk Saree', brand: 'Samira Collection', price: 1299, originalPrice: 2499, discountPercentage: 48 },
  size: '',
  setSize: jest.fn(),
  color: '',
  setColor: jest.fn(),
  quantity: 1,
  setQuantity: jest.fn(),
  deliveryPin: '',
  setDeliveryPin: jest.fn(),
  onCheckDelivery: jest.fn(),
  onAddToCart: jest.fn(),
  onBuyNow: jest.fn(),
  onOrderWhatsApp: jest.fn(),
  onShare: jest.fn(),
  selectedStock: 1,
  isOutOfStock: false,
};

describe('desktop product purchase information', () => {
  beforeEach(() => jest.clearAllMocks());

  test('does not invent unavailable size or colour values', () => {
    render(<ProductInfoPanel {...baseProps} />);

    expect(screen.queryByText(/Select size/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Select colour/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Increase quantity' })).toBeDisabled();
  });

  test('hides legacy size values for a saree', () => {
    render(<ProductInfoPanel {...baseProps} product={{ ...baseProps.product, sizes: ['S', 'M', 'XL'] }} />);

    expect(screen.queryByText(/Select size/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Size guide/i })).not.toBeInTheDocument();
  });

  test('shows a working factual price breakdown', () => {
    render(<ProductInfoPanel {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'Price details' }));
    expect(screen.getByText('Maximum retail price')).toBeInTheDocument();
    expect(screen.getByText('Product discount')).toBeInTheDocument();
    expect(screen.getByText('Selling price')).toBeInTheDocument();
  });

  test('shows delivery results returned by the delivery workflow', () => {
    render(
      <ProductInfoPanel
        {...baseProps}
        deliveryPin="110001"
        deliveryResult={{ status: 'success', title: 'Options for 110001', lines: ['This order qualifies for free shipping.', 'Cash on Delivery is available.'] }}
      />,
    );

    expect(screen.getByText('Options for 110001')).toBeInTheDocument();
    expect(screen.getByText('This order qualifies for free shipping.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Check' }));
    expect(baseProps.onCheckDelivery).toHaveBeenCalledWith('110001');
  });
});
