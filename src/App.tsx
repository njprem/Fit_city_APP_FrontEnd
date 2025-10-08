import './App.css'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LandingPage } from './pages/Traveler/LandingPage/LandingPage';
import LoginPage from "./pages/Traveler/LandingPage/LogInPage";
import SignUpPage from "./pages/Traveler/LandingPage/SignupPage";
import TermandCondition from './pages/Traveler/LandingPage/TermandCondition';
// import ForgotPassword from './pages/Traveler/LandingPage/ForgotPassword';

export default function App() {
  return (
   <>
      <Router>
          <Routes>
            <Route path= "/" element = {<LandingPage/>}/>
            <Route path="/login" element={<LoginPage/>} />
            <Route path="/signup" element={<SignUpPage/>} />
            <Route path="/terms" element={<TermandCondition/>} />
            {/* <Route path="/forgot-password" element={<ForgotPassword/>} /> */}
          </Routes>
      </Router>
   </>
  );
}