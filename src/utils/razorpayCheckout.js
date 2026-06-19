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

export async function openRazorpayCheckout({
  key,
  amount,
  currency = 'INR',
  orderId,
  name,
  email,
  contact,
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
