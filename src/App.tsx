import './App.css'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LandingPage } from './pages/Traveler/LandingPage/LandingPage';

export default function App() {
  return (
   <>
      <Router>
          <Routes>
            <Route path= "/" element = {<LandingPage/>}/>
          </Routes>
      </Router>
   </>
  );
}