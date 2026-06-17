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
      {wishlist.items.length ? (
        <ProductGrid products={wishlist.items} navigate={navigate} />
      ) : (
        <Card>
          <CardContent className="p-6 text-center md:p-10">
            <h2 className="section-title">Your wishlist is empty</h2>
            <p className="body-text mt-2 text-slate-500">Browse the collection and save styles you want to revisit.</p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
