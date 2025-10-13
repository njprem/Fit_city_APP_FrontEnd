import Navbar from "../../../components/navbar";
import Footer from "../../../components/footer";

const faqs = [
  {
    question: "How do I book an activity?",
    answer:
      "Search for an activity, review the available time slots, and click the Book button. You can pay securely inside the app and track the booking from your profile.",
  },
  {
    question: "Can I reschedule or cancel?",
    answer:
      "Most activities support changes up to 24 hours before the start time. Open your booking, choose Manage, and follow the prompts. The policy for each activity appears on its detail page.",
  },
  {
    question: "Where can I see my progress?",
    answer:
      "Visit your dashboard to see completed sessions, upcoming activities, and wellness streaks. You can also download a monthly summary as a PDF.",
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-10">
        <header className="max-w-3xl mx-auto text-center">
          <p className="text-sm uppercase tracking-wide text-[#016B71] font-semibold">Need assistance?</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-slate-900">Help & Support</h1>
          <p className="mt-3 text-base text-slate-600">
            We are here around the clock to keep your journey smooth. Browse the quick answers below or reach out directly.
          </p>
        </header>

        <section className="max-w-4xl mx-auto mt-12 grid gap-6">
          {faqs.map((faq) => (
            <article key={faq.question} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-lg font-semibold text-slate-900">{faq.question}</h2>
              <p className="mt-3 text-sm text-slate-600">{faq.answer}</p>
            </article>
          ))}
        </section>

        <section className="max-w-4xl mx-auto mt-12 rounded-2xl bg-[#016B71] px-6 py-8 text-white">
          <h2 className="text-2xl font-semibold">Still need help?</h2>
          <p className="mt-2 text-sm text-white/80">
            Our support coaches are available daily from 6:00 AM to 10:00 PM (ICT). Drop us a line and we will respond within a few hours.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/70">Chat</p>
              <p className="text-base font-semibold">Live in-app support</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-white/70">Email</p>
              <p className="text-base font-semibold">support@fitcity.app</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-white/70">Phone</p>
              <p className="text-base font-semibold">+66 02-123-4567</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#016B71] hover:bg-slate-100"
            >
              Start Live Chat
            </button>
            <button
              type="button"
              className="rounded-full border border-white px-5 py-2 text-sm font-semibold hover:bg-white/10"
            >
              Submit a Ticket
            </button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
