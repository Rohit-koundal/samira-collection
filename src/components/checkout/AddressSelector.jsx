export default function AddressSelector() {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black">Select Delivery Address</h2>
      <div className="mt-4 rounded-2xl border-2 border-wine p-4">
        <p className="font-black">Demo Customer</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">221 Fashion Street, Jaipur, Rajasthan - 302001</p>
        <span className="mt-3 inline-flex rounded-full bg-blush px-3 py-1 text-xs font-black text-wine">Default Home</span>
      </div>
      <button className="mt-4 rounded-xl border border-slate-200 px-4 py-3 text-sm font-black">Add New Address</button>
    </section>
  );
}
