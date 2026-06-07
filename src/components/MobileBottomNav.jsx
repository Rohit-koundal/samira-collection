const navItems = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'categories', label: 'Categories', icon: '🧵' },
  { id: 'search', label: 'Search', icon: '🔎' },
  { id: 'wishlist', label: 'Wishlist', icon: '❤️' },
  { id: 'cart', label: 'Cart', icon: '🛍️' },
];

export default function MobileBottomNav({ active, onChange }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/98 backdrop-blur shadow-[0_-10px_30px_rgba(15,23,42,0.08)]">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
        {navItems.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`inline-flex flex-col items-center gap-1 rounded-3xl px-3 py-2 text-[11px] transition ${
                isActive ? 'bg-[#8a4a42] text-white shadow-sm' : 'text-slate-500 hover:text-[#8a4a42]'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-semibold">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
