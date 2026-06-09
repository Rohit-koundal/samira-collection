export default function Loader({ label = 'Loading...' }) {
  return (
    <div className="grid min-h-32 place-items-center rounded-2xl bg-white p-6 text-sm font-black text-slate-500 shadow-sm">
      {label}
    </div>
  );
}
