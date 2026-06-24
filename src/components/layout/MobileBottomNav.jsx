import Icon from './Icon';

const tabs = [
  ['/', 'Home', 'home'],
  ['/products', 'Products', 'grid'],
  ['/search', 'Search', 'search'],
  ['/wishlist', 'Wishlist', 'heart'],
  ['/cart', 'Cart', 'bag'],
  ['/profile', 'Profile', 'user'],
];

export default function MobileBottomNav({ active, navigate }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <div className="grid h-16 grid-cols-6">
        {tabs.map(([path, label, icon]) => (
          <button key={label} onClick={() => navigate(path)} className={`flex min-w-0 flex-col items-center justify-center gap-1 text-[10px] font-bold ${active === path ? 'text-rose' : 'text-slate-500'}`}>
            <Icon name={icon} className="h-5 w-5" />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
