export default function OrderDetail() {
  const statuses = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
  return <section className="container-page py-8"><div className="rounded-3xl bg-white p-7 shadow-sm"><h1 className="text-3xl font-black">Order Detail</h1><div className="mt-6 grid gap-4">{statuses.map((status, index) => <div key={status} className="flex items-center gap-4"><span className={`h-4 w-4 rounded-full ${index < 3 ? 'bg-rose' : 'bg-slate-200'}`} /><span className="font-bold">{status}</span></div>)}</div><button className="mt-6 rounded-xl border border-rose px-5 py-3 text-sm font-black text-rose">Request Return / Exchange</button></div></section>;
}
