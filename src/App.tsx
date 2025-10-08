import './App.css'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LandingPage } from './pages/Traveler/LandingPage/LandingPage';
<<<<<<< HEAD
import ProfilePage from "./pages/Traveler/LandingPage/Profile_Page";
=======
import LoginPage from "./pages/Traveler/LandingPage/LogInPage";
import SignUpPage from "./pages/Traveler/LandingPage/SignupPage";
import TermandCondition from './pages/Traveler/LandingPage/TermandCondition';
import ForgotPassword from './pages/Traveler/LandingPage/ForgotPassword';
>>>>>>> 78099543ea5f099364d84b4f33f890755ed32325

export default function App() {
  return (
   <>
      <Router>
          <Routes>
            <Route path= "/" element = {<LandingPage/>}/>
<<<<<<< HEAD
            <Route path="/profile" element={<ProfilePage />} />
=======
            <Route path="/login" element={<LoginPage/>} />
            <Route path="/signup" element={<SignUpPage/>} />
            <Route path="/terms" element={<TermandCondition/>} />
            <Route path="/forgot-password" element={<ForgotPassword/>} />
>>>>>>> 78099543ea5f099364d84b4f33f890755ed32325
          </Routes>
      </Router>
   </>
  );
}
