export default function CartItem({ item, updateQuantity, removeFromCart }) {
  return (
    <div className="flex gap-4 rounded-3xl bg-white p-4 shadow-sm">
      <div className="h-28 w-24 shrink-0 rounded-2xl bg-gradient-to-br from-blush to-[#f8e5c6]" />
      <div className="min-w-0 flex-1">
        <div className="flex justify-between gap-3">
          <div>
            <h3 className="truncate text-sm font-black text-charcoal">{item.product.name}</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">Size: {item.size} | Color: {item.color}</p>
          </div>
          <button onClick={() => removeFromCart(item.product.id)} className="text-sm font-black text-rose">Remove</button>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center rounded-full border border-slate-200">
            <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="h-9 w-9 font-black">-</button>
            <span className="w-8 text-center text-sm font-black">{item.quantity}</span>
            <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="h-9 w-9 font-black">+</button>
          </div>
          <p className="text-sm font-black">Rs. {item.product.price * item.quantity}</p>
        </div>
      </div>
    </div>
  );
}
