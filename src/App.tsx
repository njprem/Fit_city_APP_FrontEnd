import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LandingPage } from './pages/Traveler/LandingPage/LandingPage';
import ProfilePage from "./pages/Traveler/LandingPage/Profile_Page";
import LoginPage from "./pages/Traveler/LandingPage/LogInPage";
import SignUpPage from "./pages/Traveler/LandingPage/SignupPage";
import TermandCondition from "./pages/Traveler/LandingPage/TermandCondition";
import ForgotPassword from "./pages/Traveler/LandingPage/ForgotPassword";
import FavoritePage from "./pages/Traveler/Favorite/FavoritePage";
import HelpPage from "./pages/Traveler/Help/HelpPage";
import RequireAuth from "./components/RequireAuth";
import UnauthorizedPage from "./pages/Traveler/LandingPage/UnauthorizedPage";

export default function App() {
  // 🛠️ ตั้งค่าเริ่มต้นเป็น 'destinations' เพื่อให้เห็นหน้า Destination Management ทันที
  const [activePage, setActivePage] = useState('destinations'); 

  const handleSignOut = () => {
    console.log("User signed out!");
    // Logic การออกจากระบบจริงจะอยู่ที่นี่
  };

  const renderContent = () => {
    if (activePage === 'destinations') {
      return <DestinationManagement />;
    }
    // เพิ่มหน้าอื่น ๆ ที่นี่ในอนาคต
    return (
        <div className="flex-1 p-8 bg-gray-100">
            <h1 className="text-3xl font-bold mb-4 text-gray-700">Page: {activePage}</h1>
            <p className="text-gray-500">Click Destination Management เพื่อดูหน้าจอ</p>
        </div>
    );
  };

  return (
    // ✅ แก้ไข: ใช้ flex และ min-h-screen เพื่อให้ Layout ยืดเต็มหน้าจอเสมอ
    // โดยไม่มีการ Scroll ของ Container หลัก
    <div className="flex w-full min-h-screen bg-gray-100">
      
      {/* 1. Sidebar */}
      {/* ⚠️ Sidebar ไม่ควรมี h-screen ซ้ำ แต่ควรใช้โครงสร้างที่กำหนดใน Sidebar.tsx แทน */}
      <Sidebar 
        activeKey={activePage} 
        onMenuClick={setActivePage} 
        onSignOut={handleSignOut}
      />

      {/* 2. ส่วนเนื้อหาหลัก */}
      {/* ✅ แก้ไข: flex-1 ยืดเต็มพื้นที่ที่เหลือ, overflow-y-auto ทำให้เนื้อหาเลื่อนได้ถ้ายาวเกิน */}
      <main className="flex-1 overflow-y-auto"> 
        {renderContent()}
      </main>
    </div>
  );
}