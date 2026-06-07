export default function SizeChartModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">Size Chart</h2>
          <button onClick={onClose} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black">Close</button>
        </div>
        <table className="mt-5 w-full text-left text-sm">
          <tbody className="[&>tr>td]:border-b [&>tr>td]:border-slate-100 [&>tr>td]:py-3">
            {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size, index) => (
              <tr key={size}><td className="font-black">{size}</td><td>Bust {32 + index * 2}"</td><td>Waist {26 + index * 2}"</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
