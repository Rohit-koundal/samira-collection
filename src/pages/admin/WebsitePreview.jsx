import { Component, lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { CartContext } from '../../context/CartContext';
import { WishlistContext } from '../../context/WishlistContext';
import { useWebsiteCustomization } from '../../context/WebsiteCustomizationContext';
import { buildWebsiteCssVariables } from '../../config/websiteCustomization';
import { websiteDataAttributes } from '../../config/websiteDesigner';
import Navbar from '../../components/layout/Navbar';
import MobileHeader from '../../components/layout/MobileHeader';
import MobileBottomNav from '../../components/layout/MobileBottomNav';
import Footer from '../../components/layout/Footer';

const Home = lazy(() => import('../customer/Home'));
const Products = lazy(() => import('../customer/Products'));
const Contact = lazy(() => import('../customer/Contact'));
const noop = () => {};
const guest = { user: null, loading: false, switchMode: noop };
const emptyCart = { items: [], itemCount: 0, loading: false, getCartItem: noop, addToCart: noop };
const emptyWishlist = { items: [], loading: false, toggleWishlist: noop, addToWishlist: noop, removeFromWishlist: noop };

// A fresh iframe document supplies real CSS/media-query boundaries. No auth,
// cart syncing, attribution or shopper storage providers run in this route.
export default function WebsitePreview() {
  return <PreviewErrorBoundary><PreviewContent /></PreviewErrorBoundary>;
}

export class PreviewErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() {
    const token = new URLSearchParams(window.location.search).get('token');
    if (token && window.parent !== window) {
      window.parent.postMessage({ type: 'samira:preview-error', token }, window.location.origin);
    }
  }
  render() {
    return this.state.failed
      ? <p role="alert" className="p-6 text-sm text-slate-600">This preview could not render. Your editor draft is safe. Use Retry preview in Website Designer.</p>
      : this.props.children;
  }
}

function PreviewContent() {
  const { config, loading } = useWebsiteCustomization();
  const [path, setPath] = useState('/');
  const websiteStyle = useMemo(() => buildWebsiteCssVariables(config), [config]);
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token || window.parent === window) return undefined;
    const receive = (event) => {
      if (event.origin !== window.location.origin || event.source !== window.parent ||
        event.data?.token !== token || event.data?.type !== 'samira:theme-preview') return;
      if (['/', '/products', '/contact'].includes(event.data.path)) setPath(event.data.path);
    };
    const prevent = (event) => { event.preventDefault(); event.stopImmediatePropagation(); };
    window.addEventListener('message', receive);
    document.addEventListener('click', prevent, true);
    document.addEventListener('submit', prevent, true);
    window.parent.postMessage({ type: 'samira:preview-ready', token }, window.location.origin);
    return () => {
      window.removeEventListener('message', receive);
      document.removeEventListener('click', prevent, true);
      document.removeEventListener('submit', prevent, true);
    };
  }, []);
  if (loading) return <p className="p-6 text-sm text-slate-500">Open this preview from Website Designer.</p>;
  const Page = path === '/products' ? Products : path === '/contact' ? Contact : Home;
  return <AuthContext.Provider value={guest}><CartContext.Provider value={emptyCart}><WishlistContext.Provider value={emptyWishlist}>
    <div className="site-storefront min-h-screen bg-ivory text-charcoal" style={websiteStyle} {...websiteDataAttributes(config)}>
      <Navbar navigate={noop} route={path} />
      <MobileHeader navigate={noop} route={path} />
      <main className="pb-20 lg:pb-0"><Suspense fallback={<p className="p-6">Loading storefront…</p>}><Page key={path} navigate={noop} route={path} /></Suspense></main>
      <Footer navigate={noop} /><MobileBottomNav active={path} navigate={noop} />
    </div>
  </WishlistContext.Provider></CartContext.Provider></AuthContext.Provider>;
}
