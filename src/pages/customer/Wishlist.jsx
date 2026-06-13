import ProductGrid from '../../components/product/ProductGrid';
import { useWishlist } from '../../context/WishlistContext';

export default function Wishlist({ navigate }) {
  const wishlist = useWishlist();
  return <section className="container-page py-6 md:py-8"><h1 className="mb-5 text-2xl font-black md:mb-6 md:text-3xl">Wishlist</h1><ProductGrid products={wishlist.items} navigate={navigate} /></section>;
}
