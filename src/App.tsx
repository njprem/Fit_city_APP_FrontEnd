import './App.css'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LandingPage } from './pages/Traveler/LandingPage/LandingPage';
import SignUpPage from "./pages/Traveler/LandingPage/SignupPage";

export default function App() {
  return (
   <>
      <Router>
          <Routes>
            <Route path= "/" element = {<LandingPage/>}/>
            <Route path="/signup" element={<SignUpPage />} />
          </Routes>
      </Router>
   </>
  );
}