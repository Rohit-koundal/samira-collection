export default function PriceSummary({ cart, cta = 'Checkout', onAction }) {
  return (
    <aside className="rounded-3xl bg-white p-5 shadow-sm">
      <h2 className="text-sm font-black uppercase tracking-[0.2em] text-charcoal">Price Summary</h2>
      <div className="mt-5 space-y-3 text-sm font-semibold text-slate-600">
        <Row label="Total MRP" value={`Rs. ${cart.totalMRP}`} />
        <Row label="Discount on MRP" value={`- Rs. ${cart.discount}`} good />
        <Row label="Coupon Discount" value={`- Rs. ${cart.couponDiscount}`} good />
        <Row label="Delivery Charges" value={cart.deliveryCharge ? `Rs. ${cart.deliveryCharge}` : 'FREE'} />
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-5 text-lg font-black">
        <span>Total</span>
        <span>Rs. {cart.finalAmount}</span>
      </div>
      <button onClick={onAction} className="mt-5 h-12 w-full rounded-xl bg-rose text-sm font-black text-white">{cta}</button>
    </aside>
  );
}

function Row({ label, value, good }) {
  return <div className="flex justify-between"><span>{label}</span><span className={good ? 'text-emerald-600' : ''}>{value}</span></div>;
}
