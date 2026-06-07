import ProductGrid from '../../components/product/ProductGrid';
import { useWishlist } from '../../context/WishlistContext';

export default function Wishlist({ navigate }) {
  const wishlist = useWishlist();
  return <section className="container-page py-8"><h1 className="mb-6 text-3xl font-black">Wishlist</h1><ProductGrid products={wishlist.items} navigate={navigate} /></section>;
}
