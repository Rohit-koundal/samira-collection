import { buildPaymentMethodConfig, RAZORPAY_METHODS } from './razorpayCheckout';

describe('Razorpay payment method selection', () => {
  test.each([
    ['UPI', 'upi'],
    ['CARD', 'card'],
    ['NETBANKING', 'netbanking'],
    ['WALLET', 'wallet'],
  ])('maps %s to the matching Razorpay method', (checkoutMethod, gatewayMethod) => {
    const result = buildPaymentMethodConfig(checkoutMethod);

    expect(RAZORPAY_METHODS[checkoutMethod]).toBe(gatewayMethod);
    expect(result.method).toBe(gatewayMethod);
    expect(result.config.display.blocks.selected.instruments).toEqual([{ method: gatewayMethod }]);
    expect(result.config.display.sequence).toEqual(['block.selected']);
    expect(result.config.display.preferences.show_default_blocks).toBe(false);
  });

  test('accepts a lower-case method safely', () => {
    expect(buildPaymentMethodConfig('card').method).toBe('card');
  });

  test('does not add an online gateway configuration for COD or unknown values', () => {
    expect(buildPaymentMethodConfig('COD')).toEqual({});
    expect(buildPaymentMethodConfig('CRYPTO')).toEqual({});
    expect(buildPaymentMethodConfig()).toEqual({});
  });
});
