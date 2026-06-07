export default function OrderSummary({ items }) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black">Order Summary</h2>
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <div key={item.product.id} className="flex justify-between gap-4 text-sm">
            <span className="font-semibold text-slate-600">{item.product.name} x {item.quantity}</span>
            <span className="font-black">Rs. {item.product.price * item.quantity}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
