import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import DesktopHeader from './components/layout/DesktopHeader';
import MobileHeader from './components/layout/MobileHeader';
import MobileBottomNav from './components/layout/MobileBottomNav';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AdminRoute from './components/layout/AdminRoute';
import LoginPrompt, { clearLoginPromptDismissed, isLoginPromptDismissed, markLoginPromptDismissed } from './components/auth/LoginPrompt';
import { useAuth } from './context/AuthContext';

const Home = lazy(() => import('./pages/customer/Home'));
const Products = lazy(() => import('./pages/customer/Products'));
const ProductDetail = lazy(() => import('./pages/customer/ProductDetail'));
const Wishlist = lazy(() => import('./pages/customer/Wishlist'));
const Cart = lazy(() => import('./pages/customer/Cart'));
const Checkout = lazy(() => import('./pages/customer/Checkout'));
const Login = lazy(() => import('./pages/customer/Login'));
const Register = lazy(() => import('./pages/customer/Register'));
const Profile = lazy(() => import('./pages/customer/Profile'));
const AddressManagement = lazy(() => import('./pages/customer/AddressManagement'));
const MyOrders = lazy(() => import('./pages/customer/MyOrders'));
const OrderDetail = lazy(() => import('./pages/customer/OrderDetail'));
const OrderSuccess = lazy(() => import('./pages/customer/OrderSuccess'));
const PaymentFailed = lazy(() => import('./pages/customer/PaymentFailed'));
const Contact = lazy(() => import('./pages/customer/Contact'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminProducts = lazy(() => import('./pages/admin/Products'));
const AddProduct = lazy(() => import('./pages/admin/AddProduct'));
const EditProduct = lazy(() => import('./pages/admin/EditProduct'));
const Categories = lazy(() => import('./pages/admin/Categories'));
const Orders = lazy(() => import('./pages/admin/Orders'));
const AdminOrderDetail = lazy(() => import('./pages/admin/OrderDetail'));
const Customers = lazy(() => import('./pages/admin/Customers'));
const Coupons = lazy(() => import('./pages/admin/Coupons'));
const Banners = lazy(() => import('./pages/admin/Banners'));
const Reviews = lazy(() => import('./pages/admin/Reviews'));
const Returns = lazy(() => import('./pages/admin/Returns'));
const Inventory = lazy(() => import('./pages/admin/Inventory'));
const Reports = lazy(() => import('./pages/admin/Reports'));
const Settings = lazy(() => import('./pages/admin/Settings'));

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
  '/profile/addresses': AddressManagement,
  '/profile/addresses/new': AddressManagement,
  '/profile/addresses/edit': AddressManagement,
  '/orders': MyOrders,
  '/order-detail': OrderDetail,
  '/order-success': OrderSuccess,
  '/payment-failed': PaymentFailed,
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

  const navigate = useCallback((path) => {
    window.location.hash = path;
    setRoute(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return [route, navigate];
}

export default function App() {
  const [route, navigate] = useHashRoute();

  return (
    <AuthProvider navigate={navigate}>
      <CartProvider>
        <WishlistProvider>
          <AppShell route={route} navigate={navigate} />
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}

function AppShell({ route, navigate }) {
  const routePath = route.split('?')[0];
  const isAdmin = routePath.startsWith('/admin');
  const { user } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches);
  const protectedRoutes = ['/profile', '/orders', '/checkout', '/order-detail', '/order-success'];
  const focusedMobileRoutes = ['/product', '/cart', '/checkout'];
  const standaloneAuthRoutes = ['/login', '/register'];
  const immersiveRoutes = ['/profile/addresses/new', '/profile/addresses/edit'];
  const loginFallback = (
    <Suspense fallback={<RouteFallback />}>
      <Login route={`/login?redirect=${encodeURIComponent(route)}`} />
    </Suspense>
  );
  const Page = useMemo(() => {
    if (routePath === '/admin/login') return AdminLogin;
    if (isAdmin) return adminRoutes[routePath] || Dashboard;
    return customerRoutes[routePath] || Home;
  }, [isAdmin, routePath]);
  const page = (
    <Suspense fallback={<RouteFallback />}>
      <Page navigate={navigate} route={route} />
    </Suspense>
  );

  useEffect(() => {
    if (isAdmin || user) {
      setShowLoginPrompt(false);
      return;
    }

    if (routePath === '/login' || routePath === '/register' || routePath === '/admin/login') {
      setShowLoginPrompt(false);
      return;
    }

    if (routePath === '/profile') {
      clearLoginPromptDismissed();
      setShowLoginPrompt(false);
      return;
    }

    if (isLoginPromptDismissed()) {
      setShowLoginPrompt(false);
      return;
    }

    const timer = window.setTimeout(() => setShowLoginPrompt(true), 250);
    return () => window.clearTimeout(timer);
  }, [isAdmin, routePath, user]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const onChange = (event) => setIsMobile(event.matches);
    media.addEventListener('change', onChange);
    setIsMobile(media.matches);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const closeLoginPrompt = () => {
    markLoginPromptDismissed();
    setShowLoginPrompt(false);
  };
  const shouldShowStandaloneAuth = standaloneAuthRoutes.includes(routePath) || (protectedRoutes.includes(routePath) && !user);
  const authContent = protectedRoutes.includes(routePath) && !user ? loginFallback : page;
  const showShell = !(isMobile && immersiveRoutes.includes(routePath));

  return (
    <div className="min-h-screen bg-ivory text-charcoal">
      {isAdmin ? (
        routePath === '/admin/login' ? (
          page
        ) : (
          <AdminRoute>
            {page}
          </AdminRoute>
        )
      ) : shouldShowStandaloneAuth ? (
        authContent
      ) : (
        <>
          {showShell && <DesktopHeader navigate={navigate} route={route} />}
          {showShell && !focusedMobileRoutes.includes(routePath) && <MobileHeader navigate={navigate} route={route} />}
          <main className={`${showShell ? 'pb-20 md:pb-0' : ''}`}>
            {protectedRoutes.includes(routePath) ? (
              <ProtectedRoute>
                {page}
              </ProtectedRoute>
            ) : (
              page
            )}
          </main>
          {showShell && <Footer navigate={navigate} />}
          {showShell && <MobileBottomNav active={routePath} navigate={navigate} />}
          {showShell && (
            <LoginPrompt
              open={showLoginPrompt}
              onClose={closeLoginPrompt}
              onContinue={(phone) => {
                markLoginPromptDismissed();
                setShowLoginPrompt(false);
                const redirectQuery = `redirect=${encodeURIComponent(route)}`;
                const phoneQuery = phone ? `phone=${encodeURIComponent(phone)}` : '';
                navigate(`/login?${[redirectQuery, phoneQuery].filter(Boolean).join('&')}`);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

function RouteFallback() {
  return (
    <div className="grid min-h-[50vh] place-items-center px-4 text-sm font-black text-slate-500">
      Loading...
    </div>
  );
}
