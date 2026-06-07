import { products } from '../../data/seedAdmin';

export default function Products() {
  return (
    <AdminPage title="Products" action="Add Product" href="#/admin/products/add">
      <AdminTable heads={['Image', 'Product Name', 'Category', 'Price', 'Stock', 'Status', 'Featured', 'Actions']} rows={products.slice(0, 12).map((p) => ['SC', p.name, p.category, `Rs. ${p.price}`, p.stock, p.isActive ? 'Active' : 'Inactive', p.isFeatured ? 'Yes' : 'No', 'View / Edit / Delete'])} />
    </AdminPage>
  );
}

export function AdminPage({ title, action, href, children }) {
  return <section className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl font-black">{title}</h1><p className="mt-1 text-sm font-semibold text-slate-500">Search, filter, create, edit and manage records.</p></div>{action && <a href={href} className="rounded-xl bg-wine px-5 py-3 text-sm font-black text-white">{action}</a>}</div>{children}</section>;
}

export function AdminTable({ heads, rows }) {
  return <div className="overflow-hidden rounded-3xl bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-[#f7f2eb] text-xs uppercase tracking-[0.16em] text-slate-500"><tr>{heads.map((head) => <th key={head} className="px-4 py-4">{head}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i} className="border-t border-slate-100">{row.map((cell, j) => <td key={`${i}-${j}`} className="px-4 py-4 font-semibold text-slate-700">{cell}</td>)}</tr>)}</tbody></table></div></div>;
}
