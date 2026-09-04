import { Card, CardContent } from '../../components/ui';
import ProductGrid from '../../components/product/ProductGrid';
import { useWishlist } from '../../context/WishlistContext';

export default function Wishlist({ navigate }) {
  const wishlist = useWishlist();
  return (
    <section className="container-page py-6 md:py-8">
      <div className="mb-5 md:mb-6">
        <h1 className="page-title md:text-3xl">Wishlist</h1>
        <p className="body-text mt-2 text-slate-500">Saved pieces for your next pick.</p>
      </div>
      {wishlist.loading ? (
        <Card>
          <CardContent className="grid min-h-40 place-items-center p-6 md:p-10">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-[3px] border-wine border-t-transparent" />
              <p className="mt-3 text-sm font-semibold text-slate-500">Loading wishlist...</p>
            </div>
          </CardContent>
        </Card>
      ) : wishlist.items.length ? (
        <ProductGrid products={wishlist.items} navigate={navigate} />
      ) : (
        <Card>
          <CardContent className="p-6 text-center md:p-10">
            <h2 className="section-title">Your wishlist is empty</h2>
            <p className="body-text mt-2 text-slate-500">Browse the collection and save styles you want to revisit.</p>
            <button type="button" onClick={() => navigate('/products')} className="mt-5 rounded-xl bg-wine px-5 py-3 text-sm font-black text-white">Browse products</button>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
