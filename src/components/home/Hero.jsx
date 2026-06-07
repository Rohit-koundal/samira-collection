export default function Hero({ navigate }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-wine via-[#9d3154] to-rose text-white">
      <div className="container-page grid min-h-[520px] items-center gap-10 py-14 md:grid-cols-[1fr_0.85fr]">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.3em] text-[#ffd6df]">New festive collection</p>
          <h1 className="mt-5 max-w-3xl font-display text-5xl font-black leading-tight md:text-7xl">Premium fashion for every celebration.</h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-white/80">Shop sarees, suits, kurtis, dresses, lehengas, gowns and curated daily wear with an app-like shopping experience.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => navigate('/products')} className="rounded-full bg-white px-7 py-4 text-sm font-black text-wine">Shop Collection</button>
            <button onClick={() => navigate('/category')} className="rounded-full border border-white/40 px-7 py-4 text-sm font-black text-white">Explore Categories</button>
          </div>
        </div>
        <div className="relative hidden h-[430px] md:block">
          <div className="absolute inset-x-8 bottom-0 h-[92%] rounded-t-[220px] bg-[#fff4dc]/20" />
          <div className="absolute left-1/2 top-16 h-28 w-24 -translate-x-1/2 rounded-t-full bg-[#f2c0aa]" />
          <div className="absolute bottom-0 left-1/2 h-[72%] w-[58%] -translate-x-1/2 rounded-t-[180px] bg-[#ffd3dc]/25 ring-[18px] ring-white/15" />
        </div>
      </div>
    </section>
  );
}
