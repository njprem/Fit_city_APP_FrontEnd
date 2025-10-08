import './App.css'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LandingPage } from './pages/Traveler/LandingPage/LandingPage';
import ProfilePage from "./pages/Traveler/LandingPage/Profile_Page";

export default function App() {
  return (
   <>
      <Router>
          <Routes>
            <Route path= "/" element = {<LandingPage/>}/>
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
      </Router>
   </>
  );
}
