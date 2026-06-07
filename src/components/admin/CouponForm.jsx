export default function CouponForm() {
  return (
    <form className="grid gap-4 rounded-3xl bg-white p-5 shadow-sm md:grid-cols-3">
      {['Coupon Code', 'Discount Value', 'Minimum Order Amount', 'Maximum Discount', 'Expiry Date', 'Usage Limit'].map((field) => <input key={field} className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-semibold" placeholder={field} />)}
      <select className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-semibold"><option>Percentage</option><option>Flat</option></select>
      <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" defaultChecked className="accent-rose" /> Active</label>
      <button className="h-12 rounded-xl bg-wine text-sm font-black text-white">Save Coupon</button>
    </form>
  );
}
