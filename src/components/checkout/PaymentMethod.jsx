export default function PaymentMethod() {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black">Payment Method</h2>
      <div className="mt-4 grid gap-3">
        {['Cash on Delivery', 'UPI placeholder', 'Card placeholder', 'Razorpay-ready structure'].map((method, index) => (
          <label key={method} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 text-sm font-bold">
            <input type="radio" name="payment" defaultChecked={index === 0} className="accent-rose" />
            {method}
          </label>
        ))}
      </div>
    </section>
  );
}
