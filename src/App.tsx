import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LandingPage } from "./pages/Traveler/LandingPage/LandingPage";
import LoginPage from "./pages/Traveler/LandingPage/LogInPage";
import SignUpPage from "./pages/Traveler/LandingPage/SignupPage";
import TermandCondition from "./pages/Traveler/LandingPage/TermandCondition";
import ProfilePage from "./pages/Traveler/LandingPage/Profile_Page";
// import ForgotPassword from "./pages/Traveler/LandingPage/ForgotPassword";
import FavoritePage from "./pages/Traveler/Favorite/FavoritePage";
import HelpPage from "./pages/Traveler/Help/HelpPage";
import RequireAuth from "./components/RequireAuth";

export default function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/terms" element={<TermandCondition />} />
          {/* <Route path="/forgot-password" element={<ForgotPassword />} /> */}
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/favorite" element={<FavoritePage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route element={<RequireAuth />}>
            {/* <Route path="/admin/dashboard" element={<AdminDashboard />} /> */}
          </Route>
          {/* <Route path="/forgot-password" element={<ForgotPassword/>} /> */}
        </Routes>
      </Router>
    </>
  );
}
