import { useEffect, useMemo, useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import DesktopHeader from './components/layout/DesktopHeader';
import MobileHeader from './components/layout/MobileHeader';
import MobileBottomNav from './components/layout/MobileBottomNav';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AdminRoute from './components/layout/AdminRoute';
import Home from './pages/customer/Home';
import Products from './pages/customer/Products';
import ProductDetail from './pages/customer/ProductDetail';
import Wishlist from './pages/customer/Wishlist';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import Login from './pages/customer/Login';
import Register from './pages/customer/Register';
import Profile from './pages/customer/Profile';
import MyOrders from './pages/customer/MyOrders';
import OrderDetail from './pages/customer/OrderDetail';
import Contact from './pages/customer/Contact';
import AdminLogin from './pages/admin/AdminLogin';
import Dashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AddProduct from './pages/admin/AddProduct';
import EditProduct from './pages/admin/EditProduct';
import Categories from './pages/admin/Categories';
import Orders from './pages/admin/Orders';
import AdminOrderDetail from './pages/admin/OrderDetail';
import Customers from './pages/admin/Customers';
import Coupons from './pages/admin/Coupons';
import Banners from './pages/admin/Banners';
import Reviews from './pages/admin/Reviews';
import Returns from './pages/admin/Returns';
import Inventory from './pages/admin/Inventory';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';

const customerRoutes = {
  '/': Home,
  '/products': Products,
  '/category': Products,
  '/search': Products,
  '/product': ProductDetail,
  '/wishlist': Wishlist,
  '/cart': Cart,
  '/checkout': Checkout,
  '/login': Login,
  '/register': Register,
  '/profile': Profile,
  '/orders': MyOrders,
  '/order-detail': OrderDetail,
  '/contact': Contact,
  '/privacy-policy': Contact,
  '/terms': Contact,
  '/return-policy': Contact,
};

const adminRoutes = {
  '/admin': Dashboard,
  '/admin/products': AdminProducts,
  '/admin/products/add': AddProduct,
  '/admin/products/edit': EditProduct,
  '/admin/categories': Categories,
  '/admin/orders': Orders,
  '/admin/orders/detail': AdminOrderDetail,
  '/admin/customers': Customers,
  '/admin/coupons': Coupons,
  '/admin/banners': Banners,
  '/admin/reviews': Reviews,
  '/admin/returns': Returns,
  '/admin/inventory': Inventory,
  '/admin/reports': Reports,
  '/admin/settings': Settings,
};

function useHashRoute() {
  const [route, setRoute] = useState(() => window.location.hash.replace('#', '') || '/');

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash.replace('#', '') || '/');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (path) => {
    window.location.hash = path;
    setRoute(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return [route, navigate];
}

export default function App() {
  const [route, navigate] = useHashRoute();
  const isAdmin = route.startsWith('/admin');
  const Page = useMemo(() => {
    if (route === '/admin/login') return AdminLogin;
    if (isAdmin) return adminRoutes[route] || Dashboard;
    return customerRoutes[route] || Home;
  }, [isAdmin, route]);

  return (
    <AuthProvider navigate={navigate}>
      <CartProvider>
        <WishlistProvider>
          <div className="min-h-screen bg-ivory text-charcoal">
            {isAdmin ? (
              route === '/admin/login' ? (
                <Page navigate={navigate} />
              ) : (
                <AdminRoute>
                  <Page navigate={navigate} />
                </AdminRoute>
              )
            ) : (
              <>
                <DesktopHeader navigate={navigate} />
                <MobileHeader navigate={navigate} />
                <main className="pb-20 md:pb-0">
                  {['/profile', '/orders', '/checkout'].includes(route) ? (
                    <ProtectedRoute>
                      <Page navigate={navigate} />
                    </ProtectedRoute>
                  ) : (
                    <Page navigate={navigate} />
                  )}
                </main>
                <Footer navigate={navigate} />
                <MobileBottomNav active={route} navigate={navigate} />
              </>
            )}
          </div>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
