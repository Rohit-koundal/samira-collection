const highlights = [
  { title: 'Premium fabrics', description: 'Soft silk, chiffon, and cotton blends curated for comfort and luxury.' },
  { title: 'Trusted quality', description: 'Finely finished designs with thoughtful embroidery and detailing.' },
  { title: 'Express delivery', description: 'Fast shipping across metro and tier-2 cities with easy tracking.' },
  { title: 'Style guidance', description: 'Curated suggestions for festive, wedding and everyday wardrobes.' },
];

export default function WhyChooseUs() {
  return (
    <section id="why-us" className="py-10 md:py-14">
      <div className="mx-auto max-w-[1440px] rounded-[40px] bg-white px-6 py-10 shadow-soft sm:px-10 lg:px-14">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8a4a42]">Why choose us</p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl">A premium shopping experience for every style.</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              From luxurious fabrics to reliable service, Samira Collection creates a seamless experience for festive and everyday ensembles.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {highlights.map((item) => (
              <div key={item.title} className="rounded-[28px] border border-slate-200 bg-[#fff6f2] p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#c69d72]">
                <h3 className="text-lg font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
