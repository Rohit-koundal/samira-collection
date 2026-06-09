export default function PaymentFailed({ navigate }) {
  return (
    <section className="container-page grid min-h-[60vh] place-items-center py-10">
      <div className="max-w-lg rounded-3xl bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-rose">Payment failed</p>
        <h1 className="mt-3 text-3xl font-black">We could not confirm your payment.</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">Your cart is still saved. You can retry online payment or choose Cash on Delivery.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button onClick={() => navigate('/checkout')} className="rounded-xl bg-wine px-5 py-3 text-sm font-black text-white">Retry Checkout</button>
          <button onClick={() => navigate('/cart')} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-black">View Cart</button>
        </div>
      </div>
    </section>
  );
}
