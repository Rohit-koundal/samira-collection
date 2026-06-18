import ProductForm from '../../components/admin/ProductForm';

export default function EditProduct({ route = '' }) {
  const productId = new URLSearchParams(route.split('?')[1] || '').get('id');
  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-wine md:text-xs md:tracking-[0.18em]">Admin / Edit Product</p>
        <h1 className="text-xl font-black text-charcoal md:text-3xl">Edit Product</h1>
        <p className="text-sm font-semibold text-slate-500">Update product details, images, pricing and catalog visibility.</p>
      </div>
      <ProductForm mode="Update" productId={productId} />
    </section>
  );
}
