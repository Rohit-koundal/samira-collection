export default function OrderTable({ orders }) {
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-[#f7f2eb] text-xs uppercase tracking-[0.16em] text-slate-500">
            <tr>{['Order ID', 'Customer', 'Date', 'Amount', 'Payment', 'Status', 'Actions'].map((head) => <th key={head} className="px-4 py-4">{head}</th>)}</tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id || order.id} className="border-t border-slate-100">
                <td className="px-4 py-4 font-black">{shortId(order._id || order.id)}</td>
                <td className="px-4 py-4">{order.user?.name || order.customer || order.shippingAddress?.fullName || 'Customer'}</td>
                <td className="px-4 py-4">{formatDate(order.createdAt || order.date)}</td>
                <td className="px-4 py-4 font-black">Rs. {order.finalAmount || order.amount}</td>
                <td className="px-4 py-4">{order.paymentMethod} / {order.paymentStatus}</td>
                <td className="px-4 py-4"><span className="rounded-full bg-blush px-3 py-1 text-xs font-black text-wine">{order.orderStatus}</span></td>
                <td className="px-4 py-4"><a href="#/admin/orders/detail" className="font-black text-rose">View</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function shortId(value = '') {
  return String(value).slice(-8).toUpperCase();
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-IN');
}
