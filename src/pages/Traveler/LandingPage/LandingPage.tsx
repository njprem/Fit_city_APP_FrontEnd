import Navbar from "../../../components/navbar";
import Footer from "../../../components/footer";
import SubNav from "../../../components/SubNav";
import CategorySection from "../../../components/Category";

export const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 p-6">
        <SubNav />
        <CategorySection />
      </main>
      <Footer />
    </div>
  );
};
