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
      </main>
      <Footer />
    </div>
  );
}
