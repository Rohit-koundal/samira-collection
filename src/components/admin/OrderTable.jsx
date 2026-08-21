export default function OrderTable({ orders }) {
  return (
    <div className="admin-table">
      <div className="overflow-x-auto">
        <table className="min-w-[700px] md:min-w-[760px]">
          <thead>
            <tr>{['Order ID', 'Customer', 'Date', 'Amount', 'Payment', 'Status', 'Actions'].map((head) => <th key={head}>{head}</th>)}</tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id || order.id}>
                <td className="font-semibold">{shortId(order._id || order.id)}</td>
                <td>{order.user?.name || order.customer || order.shippingAddress?.fullName || 'Customer'}</td>
                <td>{formatDate(order.createdAt || order.date)}</td>
                <td className="font-semibold">Rs. {order.finalAmount || order.amount}</td>
                <td>{order.paymentMethod} / {order.paymentStatus}</td>
                <td><span className="rounded-full bg-blush px-3 py-1 text-xs font-semibold text-wine">{order.orderStatus}</span></td>
                <td><a href="/admin/orders/detail" className="font-semibold text-wine">View</a></td>
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
