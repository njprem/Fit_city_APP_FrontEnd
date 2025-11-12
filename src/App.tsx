import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage/LandingPage";
import ProfilePage from "./pages/LandingPage/Profile_Page";
import LoginPage from "./pages/LandingPage/LogInPage";
import SignUpPage from "./pages/LandingPage/SignupPage";
import TermandCondition from "./pages/LandingPage/TermandCondition";
import ForgotPassword from "./pages/LandingPage/ForgotPassword";
import FavoritePage from "./pages/Favorite/FavoritePage";
import HelpPage from "./pages/Help/HelpPage";
import DestinationDetailPage from "./pages/Traveler/Destination/DestinationDetailPage";
import SearchResultsPage from "./pages/Traveler/Search/SearchResultsPage";
import RequireAuth from "./components/RequireAuth";
import UnauthorizedPage from "./pages/LandingPage/UnauthorizedPage";
import DestinationSlugRedirect from "./pages/Traveler/Destination/DestinationSlugRedirect";


import Admin_Page from "./Admin_Pages/Pages/Admin_Page";

export default function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage/>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/terms" element={<TermandCondition />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/destination/:id" element={<DestinationDetailPage />} />
          <Route path="/destination/slug/:slug" element={<DestinationSlugRedirect />} />
          <Route element={<RequireAuth />}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/favorite" element={<FavoritePage />} />
            <Route path="/admin" element={<Admin_Page />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}
