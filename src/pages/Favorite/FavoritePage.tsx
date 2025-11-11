import Navbar from "../../components/navbar";
import Footer from "../../components/footer";

const sampleFavorites = [
  {
    id: 1,
    title: "Morning Yoga at Lumpini Park",
    category: "Wellness",
    description: "Start the day with a gentle outdoor flow guided by local instructors.",
    nextSession: "Tomorrow · 6:30 AM",
  },
];

export default function FavoritePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-10">
        <header className="max-w-4xl mx-auto mb-10 text-center">
          <p className="text-sm uppercase tracking-wide text-[#016B71] font-semibold">Saved Experiences</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-slate-900">Your Favourite Activities</h1>
          <p className="mt-3 text-base text-slate-600">
            Jump back into the classes, tours, and experiences you loved. You can remove items or book again with a tap.
          </p>
        </header>

        <section className="max-w-4xl mx-auto grid gap-6">
          {sampleFavorites.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 transition hover:shadow-lg"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <span className="inline-flex items-center rounded-full bg-[#016B71]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#016B71]">
                    {item.category}
                  </span>
                  <h2 className="mt-3 text-xl font-semibold text-slate-900">{item.title}</h2>
                  <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                </div>
                <div className="flex flex-col items-start gap-3 md:items-end">
                  <p className="text-sm font-medium text-slate-500">Next session</p>
                  <p className="text-base font-semibold text-slate-900">{item.nextSession}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300"
                    >
                      Remove
                    </button>
                    <button
                      type="button"
                      className="rounded-full bg-[#016B71] px-4 py-2 text-sm font-semibold text-white hover:bg-[#01585C]"
                    >
                      Book Again
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
          {sampleFavorites.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500">
              You have not saved any activities yet. Explore the catalog and tap the heart icon to collect your favourites.
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
