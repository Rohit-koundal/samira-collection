export default function Contact() {
  return (
    <section className="container-page py-10">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl bg-white p-7 shadow-sm">
          <h1 className="text-3xl font-black">Contact Samira Collection</h1>
          <p className="mt-4 leading-7 text-slate-600">Email hello@samiracollection.com or WhatsApp +91 98765 43210 for product inquiries, returns, and store support.</p>
        </div>
        <form className="rounded-3xl bg-white p-7 shadow-sm">
          <input className="h-12 w-full rounded-xl border border-slate-200 px-4" placeholder="Name" />
          <input className="mt-3 h-12 w-full rounded-xl border border-slate-200 px-4" placeholder="Email" />
          <textarea className="mt-3 min-h-32 w-full rounded-xl border border-slate-200 p-4" placeholder="Message" />
          <button className="mt-3 h-12 w-full rounded-xl bg-wine text-sm font-black text-white">Send Message</button>
        </form>
      </div>
    </section>
  );
}
