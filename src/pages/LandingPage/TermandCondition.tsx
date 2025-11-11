import Navbar from "../../components/navbar";
import Footer from "../../components/footer";

export default function TermandCondition() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 p-6">
        <div className="mx-auto max-w-3xl bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold mb-4">Terms and Conditions</h1>
          <p className="mb-4">
            Welcome to FitCity! These terms and conditions outline the rules and regulations for the use of FitCity's Website.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}