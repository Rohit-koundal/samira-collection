export default function MobileOverlayLoader() {
  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-black/40 md:hidden"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading"
    >
      <span className="relative block h-8 w-8">
        <span className="absolute inset-0 rounded-full border-[2.5px] border-[#f4b6c5]" />
        <span
          className="absolute inset-0 rounded-full border-[2.5px] border-transparent border-r-[#a7284c] border-t-[#a7284c]"
          style={{ animation: 'samira-loader-spin 0.85s linear infinite', willChange: 'transform' }}
        />
      </span>
    </div>
  );
}
