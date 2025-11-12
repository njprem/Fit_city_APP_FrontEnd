import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import { LandingPage } from "./pages/Traveler/LandingPage/LandingPage";
// import ProfilePage from "./pages/Traveler/LandingPage/Profile_Page";
// import LoginPage from "./pages/Traveler/LandingPage/LogInPage";
// import SignUpPage from "./pages/Traveler/LandingPage/SignupPage";
// import TermandCondition from "./pages/Traveler/LandingPage/TermandCondition";
// import ForgotPassword from "./pages/Traveler/LandingPage/ForgotPassword";
// import FavoritePage from "./pages/Traveler/Favorite/FavoritePage";
// import HelpPage from "./pages/Traveler/Help/HelpPage";
// import DestinationDetailPage from "./pages/Traveler/Destination/DestinationDetailPage";
// import RequireAuth from "./components/RequireAuth";
// import UnauthorizedPage from "./pages/Traveler/LandingPage/UnauthorizedPage";
import Admin_Page from "./Admin_Pages/Pages/Admin_Page";

export default function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Admin_Page/>} />
          {/* <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/terms" element={<TermandCondition />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/destination/:id" element={<DestinationDetailPage />} />
          <Route element={<RequireAuth />}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/favorite" element={<FavoritePage />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route> */}
        </Routes>
      </Router>
    </>
  );
}