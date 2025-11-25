import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Destination_Management from "./Destination_Management";
import Destination_Request from "./Destination_Request";
import AdminDashboard from "./AdminDashboard";
import Reporting from "./Reporting";
import Sidebar from "../Admin_Component/Sidebar";
import { logout } from "../../services/auth/authService";
import { getUser } from "../../services/auth/authService";

export default function Admin_Page() {
  // 🛠️ ตั้งค่าเริ่มต้นเป็น 'destinations' เพื่อให้เห็นหน้า Destination Management ทันที
  const [activePage, setActivePage] = useState('destinations'); 
  const navigate = useNavigate();
  const user = getUser();
  const adminName =
    user?.full_name ||
    user?.fullName ||
    user?.name ||
    `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() ||
    "Administrator";
  const adminEmail = user?.email ?? user?.username ?? "admin@fitcity.app";

  const handleSignOut = () => {
    logout();
    navigate("/");
  };

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'destinations':
        return (
          <Destination_Management
            onNavigateToRequests={() => setActivePage('requests')}
          />
        );
      case 'requests':
        return <Destination_Request />;
      case 'reporting':
        return <Reporting />;
      default:
        return (
          <div className="flex-1 p-8 bg-gray-100">
              <h1 className="text-3xl font-bold mb-4 text-gray-700">Page: {activePage}</h1>
              <p className="text-gray-500">Select a menu option to view its content.</p>
          </div>
        );
    }
  };

  return (
    // ✅ แก้ไข: ใช้ flex และ min-h-screen เพื่อให้ Layout ยืดเต็มหน้าจอเสมอ
    // โดยไม่มีการ Scroll ของ Container หลัก
    <div className="flex w-full min-h-screen bg-gray-100">
      
      {/* 1. Sidebar */}
      {/* ⚠️ Sidebar ไม่ควรมี h-screen ซ้ำ แต่ควรใช้โครงสร้างที่กำหนดใน Sidebar.tsx แทน */}
      <div className="sticky top-0 self-start h-screen">
        <Sidebar 
          activeKey={activePage} 
          onMenuClick={setActivePage} 
          onSignOut={handleSignOut}
          adminName={adminName}
          adminEmail={adminEmail}
        />
      </div>

      {/* 2. ส่วนเนื้อหาหลัก */}
      {/* ✅ แก้ไข: flex-1 ยืดเต็มพื้นที่ที่เหลือ, overflow-y-auto ทำให้เนื้อหาเลื่อนได้ถ้ายาวเกิน */}
      <main className="flex-1 overflow-y-auto"> 
        {renderContent()}
      </main>
    </div>
  );
}
