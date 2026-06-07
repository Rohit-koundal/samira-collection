import heroIllustration from '../assets/hero-fashion.svg';

export default function Hero() {
  return (
    <section id="hero" className="relative overflow-hidden py-8 md:py-16">
      <div className="mx-auto max-w-[1440px] rounded-[40px] bg-gradient-to-r from-[#fbebe6] via-[#f9efea] to-[#fbf3ee] p-6 shadow-soft md:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex rounded-full bg-[#f8e2dc] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#8a4a42] shadow-sm">
              New festive edit
            </div>
            <div className="space-y-4">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl md:text-5xl lg:text-6xl">
                Elegant Fashion for Every Occasion
              </h1>
              <p className="max-w-xl text-sm leading-7 text-slate-700 sm:text-base md:text-lg">
                Discover premium ethnic and modern wear at Samira Collection with curated styles for celebrations and everyday luxury.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="#new-arrivals"
                className="inline-flex items-center justify-center rounded-full bg-[#8a4a42] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#7a413d]"
              >
                Shop New Arrivals
              </a>
              <a
                href="#categories"
                className="inline-flex items-center justify-center rounded-full border border-[#d4b397] bg-white px-6 py-3 text-sm font-semibold text-[#6a4d48] transition hover:border-[#8a4a42] hover:text-[#8a4a42]"
              >
                Explore Collection
              </a>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl bg-white/90 p-4 shadow-sm">
                <p className="text-2xl font-semibold text-slate-950">₹999+</p>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Free shipping</p>
              </div>
              <div className="rounded-3xl bg-white/90 p-4 shadow-sm">
                <p className="text-2xl font-semibold text-slate-950">40%</p>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Festival sale</p>
              </div>
              <div className="rounded-3xl bg-white/90 p-4 shadow-sm">
                <p className="text-2xl font-semibold text-slate-950">4.8/5</p>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Customer rating</p>
              </div>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-[#f8cac1] via-[#f7d8d1] to-[#d4b397] p-4 shadow-xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.55),_transparent_35%)]" />
              <img src={heroIllustration} alt="Samira fashion" className="relative h-[420px] w-full object-cover rounded-[32px]" />
              <div className="absolute bottom-6 left-6 right-6 rounded-3xl border border-white/80 bg-white/85 p-5 backdrop-blur-sm">
                <p className="text-sm uppercase tracking-[0.24em] text-[#98635f]">Premium edit</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">Rose silk saree with modern shimmer</h2>
                <p className="mt-1 text-sm text-slate-600">Perfect for festive evenings and bridal moments.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
