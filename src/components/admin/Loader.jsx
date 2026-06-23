export default function Loader({ label = 'Loading...' }) {
  return (
    <div className="grid min-h-36 place-items-center rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="relative block h-10 w-10" aria-hidden="true">
          <span className="absolute inset-0 rounded-full border-[3px] border-[#f3d3da]" />
          <span
            className="absolute inset-0 rounded-full border-[3px] border-transparent border-r-[#a7284c] border-t-[#a7284c]"
            style={{ animation: 'samira-loader-spin 0.85s linear infinite', willChange: 'transform' }}
          />
        </span>
        <p className="text-sm font-black text-slate-500">{label}</p>
      </div>
    </div>
  );
}
