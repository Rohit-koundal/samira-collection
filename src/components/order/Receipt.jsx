import logo from '../../assets/samira-collection-logo.png';
import { formatAddress } from '../../utils/receiptMessage';

export default function Receipt({ receipt }) {
  return (
    <section id="samira-receipt" className="rounded-xl bg-white p-4 shadow-sm print:shadow-none md:rounded-3xl md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Samira Collection" className="h-14 rounded-xl border border-slate-100 bg-white p-1" />
          <div>
            <h2 className="text-xl font-black md:text-2xl">{receipt.storeDetails?.legalBusinessName || receipt.storeDetails?.storeName || 'Samira Collection'}</h2>
            <p className="text-xs font-bold text-slate-500">{receipt.storeDetails?.gstin ? `GSTIN ${receipt.storeDetails.gstin}` : receipt.storeDetails?.contactPhone || receipt.storeDetails?.whatsappNumber || ''}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Invoice</p>
          <p className="font-black">{receipt.invoiceNumber || `#${String(receipt.orderId).slice(-8).toUpperCase()}`}</p>
          <p className="text-xs font-semibold text-slate-500">{new Date(receipt.orderDate).toLocaleString('en-IN')}</p>
        </div>
      </div>
      <div className="grid gap-4 py-5 md:grid-cols-2">
        <Info title="Customer" lines={[receipt.customer?.name || receipt.shippingAddress?.fullName, receipt.customer?.email, receipt.shippingAddress?.mobile || receipt.shippingAddress?.phone]} />
        <Info title="Delivery Address" lines={[formatAddress(receipt.shippingAddress)]} />
        {receipt.billingAddress ? <Info title="Billing Address" lines={[formatAddress(receipt.billingAddress)]} /> : null}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm md:min-w-[620px]">
          <thead className="bg-[#f7f2eb] text-xs uppercase tracking-[0.14em] text-slate-500"><tr><th className="p-3">Product</th><th className="p-3">Size/Color</th><th className="p-3">Qty</th><th className="p-3">Price</th><th className="p-3">Total</th></tr></thead>
          <tbody>{receipt.items.map((item, index) => <tr key={`${item.name}-${index}`} className="border-b border-slate-100"><td className="p-3 font-bold">{item.name}</td><td className="p-3">{item.size || '-'} / {item.color || '-'}</td><td className="p-3">{item.quantity}</td><td className="p-3">Rs. {item.price}</td><td className="p-3 font-black">Rs. {item.price * item.quantity}</td></tr>)}</tbody>
        </table>
      </div>
      <div className="ml-auto mt-5 max-w-sm space-y-2 text-sm font-semibold">
        <Row label="Total MRP" value={`Rs. ${receipt.totalMRP || 0}`} />
        <Row label="Product Discount" value={`- Rs. ${receipt.productDiscount || 0}`} />
        <Row label="Coupon Discount" value={`- Rs. ${receipt.couponDiscount || 0}`} />
        <Row label="Delivery Charge" value={receipt.deliveryCharge ? `Rs. ${receipt.deliveryCharge}` : 'FREE'} />
        <Row label="COD Charge" value={`Rs. ${receipt.codCharge || 0}`} />
        <div className="flex justify-between border-t border-slate-100 pt-3 text-lg font-black"><span>Final Amount</span><span>Rs. {receipt.finalAmount || 0}</span></div>
      </div>
      <div className="mt-5 grid gap-3 rounded-2xl bg-[#fbf8f4] p-4 text-sm md:grid-cols-3">
        <Info title="Payment" lines={[`${receipt.paymentMethod || 'Online'} via ${receipt.paymentProvider || 'Razorpay'}`, receipt.paymentStatus]} />
        <Info title="Order Status" lines={[receipt.orderStatus, receipt.shipment?.trackingNumber ? `${receipt.shipment.courierName || 'Courier'} ${receipt.shipment.trackingNumber}` : 'Expected delivery: 5-7 days']} />
        <Info title="Policy" lines={[receipt.policies?.returnPolicy || 'Return/exchange as per policy.']} />
      </div>
      <p className="mt-5 text-center text-sm font-black text-wine">Thank you for shopping with Samira Collection.</p>
    </section>
  );
}

function Info({ title, lines = [] }) {
  return (
    <div>
      <h3 className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{title}</h3>
      {lines.filter(Boolean).map((line, index) => (
        <p key={`${title}-${index}`} className="mt-1 text-sm font-semibold text-slate-700">{line}</p>
      ))}
    </div>
  );
}

function Row({ label, value }) {
  return <div className="flex justify-between"><span>{label}</span><span>{value}</span></div>;
}
