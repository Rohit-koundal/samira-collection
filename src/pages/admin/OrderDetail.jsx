export default function OrderDetail() {
  return <section className="rounded-3xl bg-white p-6 shadow-sm"><h1 className="text-3xl font-black">Order Detail</h1><p className="mt-3 text-slate-600">Customer details, shipping address, ordered items, coupon, payment, timeline, status update and admin notes.</p><select className="mt-6 h-12 rounded-xl border border-slate-200 px-4"><option>Pending</option><option>Confirmed</option><option>Packed</option><option>Shipped</option><option>Out for Delivery</option><option>Delivered</option><option>Cancelled</option></select></section>;
}
