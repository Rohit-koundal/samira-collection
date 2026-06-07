export default function Settings() {
  const fields = ['Store Name', 'Contact Email', 'Contact Phone', 'WhatsApp Number', 'Store Address', 'Free Shipping Minimum Amount', 'Delivery Charge', 'Footer Text', 'Return Policy', 'Privacy Policy', 'Terms and Conditions'];
  return <section className="space-y-5"><h1 className="text-3xl font-black">Website Settings</h1><form className="grid gap-4 rounded-3xl bg-white p-5 shadow-sm md:grid-cols-2">{fields.map((field) => <input key={field} className="h-12 rounded-xl border border-slate-200 px-4 text-sm font-semibold" placeholder={field} />)}<button className="h-12 rounded-xl bg-wine text-sm font-black text-white md:col-span-2">Save Settings</button></form></section>;
}
