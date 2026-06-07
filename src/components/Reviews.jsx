const reviews = [
  {
    name: 'Ayesha Kapoor',
    text: 'The fabrics feel exquisite and the delivery was so fast. The festive kurti set was a dream purchase.',
    stars: 5,
  },
  {
    name: 'Riya Sharma',
    text: 'Beautiful tailoring, elegant prints and truly premium quality. I love the packaging too.',
    stars: 4.8,
  },
  {
    name: 'Nina Verma',
    text: 'A lovely shopping experience with helpful styling recommendations and amazing discounts.',
    stars: 4.9,
  },
];

export default function Reviews() {
  return (
    <section id="reviews" className="py-10 md:py-14">
      <div className="mx-auto max-w-[1440px] flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8a4a42]">Customer reviews</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">Loved by shoppers nationwide.</h2>
        </div>
        <p className="max-w-xl text-sm leading-7 text-slate-600">
          Read highlights from happy customers who enjoyed premium fashion and seamless service.
        </p>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {reviews.map((review) => (
          <article
            key={review.name}
            className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">{review.name}</h3>
                <p className="mt-2 text-sm text-slate-500">Verified buyer</p>
              </div>
              <span className="rounded-full bg-[#f7e2db] px-3 py-2 text-sm font-semibold text-[#8a4a42]">
                {review.stars} ★
              </span>
            </div>
            <p className="mt-5 text-sm leading-7 text-slate-600">“{review.text}”</p>
          </article>
        ))}
      </div>
    </section>
  );
}
