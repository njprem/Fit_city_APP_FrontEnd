import Navbar from "../../../components/navbar"; 
import Footer from "../../../components/footer";

export const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 p-6">
        {/* page content */}
      </main>

      <Footer />
    </div>
  );
};