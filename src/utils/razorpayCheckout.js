function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout'));
    document.body.appendChild(script);
  });
}

export const RAZORPAY_METHODS = Object.freeze({
  UPI: 'upi',
  CARD: 'card',
  NETBANKING: 'netbanking',
  WALLET: 'wallet',
});

const METHOD_LABELS = Object.freeze({
  UPI: 'UPI',
  CARD: 'Credit / Debit Card',
  NETBANKING: 'Net Banking',
  WALLET: 'Wallet',
});

/**
 * Keep the method selected on Samira Checkout selected inside Razorpay too.
 * The display block also limits the gateway screen to that method, so this
 * works for mobile-number-only accounts where an email may not be available
 * for Razorpay's top-level `method` preselection.
 */
export function buildPaymentMethodConfig(preferredMethod) {
  const normalizedMethod = String(preferredMethod || '').toUpperCase();
  const gatewayMethod = RAZORPAY_METHODS[normalizedMethod];
  if (!gatewayMethod) return {};

  return {
    method: gatewayMethod,
    config: {
      display: {
        blocks: {
          selected: {
            name: `Pay by ${METHOD_LABELS[normalizedMethod]}`,
            instruments: [{ method: gatewayMethod }],
          },
        },
        sequence: ['block.selected'],
        preferences: { show_default_blocks: false },
      },
    },
  };
}

export async function openRazorpayCheckout({
  key,
  amount,
  currency = 'INR',
  orderId,
  name,
  email,
  contact,
  preferredMethod,
  description = 'Samira Collection order',
  onSuccess,
  onDismiss,
}) {
  if (!key) {
    throw new Error('Online payment is not configured. Please choose Cash on Delivery or try again later.');
  }
  if (!orderId) {
    throw new Error('Unable to start payment. Please try again.');
  }

  await loadRazorpayScript();

  return new Promise((resolve, reject) => {
    const options = {
      key,
      amount,
      currency,
      name: 'Samira Collection',
      description,
      order_id: orderId,
      prefill: {
        name: name || '',
        email: email || '',
        contact: contact || '',
      },
      ...buildPaymentMethodConfig(preferredMethod),
      theme: { color: '#7b1f3a' },
      handler: (response) => {
        Promise.resolve(onSuccess(response)).then(resolve).catch(reject);
      },
      modal: {
        ondismiss: () => {
          onDismiss?.();
          reject(new Error('Payment cancelled'));
        },
      },
    };

    const checkout = new window.Razorpay(options);
    checkout.on('payment.failed', (response) => {
      const reason = response?.error?.description || 'Payment failed';
      reject(new Error(reason));
    });
    checkout.open();
  });
}
