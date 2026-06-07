export default function BannerForm() {
  return (
    <form className="grid gap-4 rounded-3xl bg-white p-5 shadow-sm md:grid-cols-2">
      {['Title', 'Subtitle', 'Button Text', 'Link', 'Display Order'].map((field) => <input key={field} className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-semibold" placeholder={field} />)}
      <select className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-semibold"><option>Hero</option><option>Offer</option><option>Category</option></select>
      <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" defaultChecked className="accent-rose" /> Active</label>
      <button className="h-12 rounded-xl bg-wine text-sm font-black text-white md:col-span-2">Save Banner</button>
    </form>
  );
}
