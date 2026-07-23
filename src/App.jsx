import { lazy, Suspense, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { MantineProvider, createTheme } from '@mantine/core';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import Navbar from './components/layout/Navbar';
import MobileHeader from './components/layout/MobileHeader';
import MobileBottomNav from './components/layout/MobileBottomNav';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AdminRoute from './components/layout/AdminRoute';
import LoginPrompt, { clearLoginPromptDismissed, isLoginPromptDismissed, markLoginPromptDismissed } from './components/auth/LoginPrompt';
import MobileOverlayLoader from './components/ui/MobileOverlayLoader';
import { useAuth } from './context/AuthContext';
import { getMobileLoaderSnapshot, subscribeMobileLoader } from './utils/mobileLoader';
import { createStoragePlan } from './utils/userStorage';

const Home = lazy(() => import('./pages/customer/Home'));
const Products = lazy(() => import('./pages/customer/Products'));
const ProductDetail = lazy(() => import('./pages/customer/ProductDetail'));
const Wishlist = lazy(() => import('./pages/customer/Wishlist'));
const Cart = lazy(() => import('./pages/customer/Cart'));
const Checkout = lazy(() => import('./pages/customer/Checkout'));
const Login = lazy(() => import('./pages/customer/Login'));
const Register = lazy(() => import('./pages/customer/Register'));
const Profile = lazy(() => import('./pages/customer/Profile'));
const ProfileDetails = lazy(() => import('./pages/customer/ProfileDetails'));
const AddressManagement = lazy(() => import('./pages/customer/AddressManagement'));
const MyOrders = lazy(() => import('./pages/customer/MyOrders'));
const OrderDetail = lazy(() => import('./pages/customer/OrderDetail'));
const OrderSuccess = lazy(() => import('./pages/customer/OrderSuccess'));
const PaymentFailed = lazy(() => import('./pages/customer/PaymentFailed'));
const Contact = lazy(() => import('./pages/customer/Contact'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminProducts = lazy(() => import('./pages/admin/Products'));
const ProductDrafts = lazy(() => import('./pages/admin/ProductDrafts'));
const AddProduct = lazy(() => import('./pages/admin/AddProduct'));
const EditProduct = lazy(() => import('./pages/admin/EditProduct'));
const Categories = lazy(() => import('./pages/admin/Categories'));
const EditCategory = lazy(() => import('./pages/admin/EditCategory'));
const VariantGroups = lazy(() => import('./pages/admin/VariantGroups'));
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
const ReelProductImport = lazy(() => import('./pages/admin/ReelProductImport'));
const reelImportEnabled = process.env.REACT_APP_ENABLE_REEL_PRODUCT_IMPORT === 'true';

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
  '/profile/details': ProfileDetails,
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
  '/admin/product-drafts': ProductDrafts,
  '/admin/products/add': AddProduct,
  '/admin/products/edit': EditProduct,
  '/admin/categories': Categories,
  '/admin/categories/edit': EditCategory,
  '/admin/variant-groups': VariantGroups,
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
  ...(reelImportEnabled ? { '/admin/reel-import': ReelProductImport } : {}),
};

const samiraTheme = createTheme({
  primaryColor: 'maroon',
  primaryShade: 8,
  defaultRadius: 'md',
  fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
  headings: {
    fontFamily: '"Playfair Display", Georgia, serif',
  },
  colors: {
    maroon: ['#f9ecef', '#f2d8de', '#e8bcc8', '#db93a6', '#cc6d87', '#ba4668', '#a92d4f', '#951c3e', '#7b1834', '#5f1128'],
  },
});

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
    <MantineProvider theme={samiraTheme}>
      <AuthProvider navigate={navigate}>
        <AppShell route={route} navigate={navigate} />
      </AuthProvider>
    </MantineProvider>
  );
}

function AppShell({ route, navigate }) {
  const routePath = route.split('?')[0];
  const isAdmin = routePath.startsWith('/admin');
  const { user } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches);
  const mobileLoaderActive = useSyncExternalStore(subscribeMobileLoader, getMobileLoaderSnapshot, getMobileLoaderSnapshot);
  const [showMobileLoader, setShowMobileLoader] = useState(false);
  const protectedRoutes = ['/profile', '/profile/details', '/orders', '/checkout', '/order-detail', '/order-success', '/wishlist'];
  const focusedMobileRoutes = ['/product', '/cart', '/checkout'];
  const hideMobileBottomNavRoutes = ['/checkout', '/profile/details'];
  const standaloneAuthRoutes = ['/login', '/register'];
  const immersiveRoutes = ['/profile/addresses/new', '/profile/addresses/edit'];
  const cartStoragePlan = useMemo(() => createStoragePlan('samira_cart', user), [user]);
  const wishlistStoragePlan = useMemo(() => createStoragePlan('samira_wishlist', user), [user]);
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

    if (routePath === '/cart') {
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

  useEffect(() => {
    if (!isMobile) {
      setShowMobileLoader(false);
      return;
    }

    if (!mobileLoaderActive) {
      const hideTimer = window.setTimeout(() => setShowMobileLoader(false), 120);
      return () => window.clearTimeout(hideTimer);
    }

    const showTimer = window.setTimeout(() => setShowMobileLoader(true), 120);
    return () => window.clearTimeout(showTimer);
  }, [isMobile, mobileLoaderActive]);

  const closeLoginPrompt = () => {
    markLoginPromptDismissed();
    setShowLoginPrompt(false);
  };
  const desktopProfileLogin = routePath === '/profile' && !user && !isMobile;
  const shouldShowStandaloneAuth =
    standaloneAuthRoutes.includes(routePath) ||
    ((protectedRoutes.includes(routePath) && !user) && !desktopProfileLogin);
  const authContent = protectedRoutes.includes(routePath) && !user ? loginFallback : page;
  const showShell = !(isMobile && immersiveRoutes.includes(routePath));
  const mainContent = desktopProfileLogin
    ? loginFallback
    : protectedRoutes.includes(routePath)
      ? (
        <ProtectedRoute>
          {page}
        </ProtectedRoute>
      )
      : page;

  return (
    <div className="min-h-screen bg-ivory text-charcoal">
      <CartProvider key={cartStoragePlan.storageName} storageName={cartStoragePlan.storageName} legacyStorageNames={cartStoragePlan.legacyStorageNames}>
        <WishlistProvider key={wishlistStoragePlan.storageName} storageName={wishlistStoragePlan.storageName} legacyStorageNames={wishlistStoragePlan.legacyStorageNames}>
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
              {showShell && <Navbar navigate={navigate} route={route} />}
              {showShell && !focusedMobileRoutes.includes(routePath) && <MobileHeader navigate={navigate} route={route} />}
              <main className={`${showShell ? 'pb-20 lg:pb-0' : ''}`}>
                {mainContent}
              </main>
              {showShell && <Footer navigate={navigate} />}
              {showShell && !hideMobileBottomNavRoutes.includes(routePath) && <MobileBottomNav active={routePath} navigate={navigate} />}
              {showShell && (
                <LoginPrompt
                  open={showLoginPrompt}
                  onClose={closeLoginPrompt}
                  onContinue={(phone) => {
                    markLoginPromptDismissed();
                    setShowLoginPrompt(false);
                    const redirectQuery = `redirect=${encodeURIComponent(route)}`;
                    const phoneQuery = phone ? `phone=${encodeURIComponent(phone)}` : '';
                    const autoSendQuery = phone ? 'autoSendOtp=1' : '';
                    const consentQuery = phone ? 'consent=1' : '';
                    navigate(`/login?${[redirectQuery, phoneQuery, autoSendQuery, consentQuery].filter(Boolean).join('&')}`);
                  }}
                />
              )}
            </>
          )}
        </WishlistProvider>
      </CartProvider>
      {showMobileLoader && <MobileOverlayLoader />}
    </div>
  );
}

function RouteFallback() {
  return (
    <>
      <MobileOverlayLoader />
      <div className="hidden min-h-[50vh] place-items-center px-4 md:grid">
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-[#eadfd5] bg-white px-8 py-10 text-center shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <span className="relative block h-12 w-12" aria-hidden="true">
            <span className="absolute inset-0 rounded-full border-[3px] border-[#f3d3da]" />
            <span
              className="absolute inset-0 rounded-full border-[3px] border-transparent border-r-[#a7284c] border-t-[#a7284c]"
              style={{ animation: 'samira-loader-spin 0.85s linear infinite', willChange: 'transform' }}
            />
          </span>
          <p className="text-sm font-black text-slate-500">Loading...</p>
        </div>
      </div>
    </>
  );
}
