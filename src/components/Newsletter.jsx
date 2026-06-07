export default function Newsletter() {
  return (
    <section id="newsletter" className="py-10 md:py-14">
      <div className="mx-auto max-w-[1440px] rounded-[40px] bg-slate-950 px-6 py-12 text-white shadow-soft sm:px-10 lg:px-14">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-rose-300">Stay updated</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-white sm:text-4xl">
              Subscribe for new drops & exclusive offers.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
              Join the Samira Collection newsletter and get early access to festive launches, limited editions, and styling inspiration.
            </p>
          </div>
          <form className="grid gap-4 sm:grid-cols-[1.8fr_1fr]">
            <label htmlFor="newsletter-email" className="sr-only">
              Enter your email
            </label>
            <input
              id="newsletter-email"
              type="email"
              placeholder="Enter your email address"
              className="rounded-full border border-white/20 bg-white/10 px-5 py-4 text-sm text-white placeholder:text-slate-300 focus:border-white focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
            <button
              type="submit"
              className="rounded-full bg-[#8a4a42] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#7a413d]"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
