import React from "react";
import { LayoutDashboard, MapPin, BookOpen, Database, User, LogOut } from "lucide-react";
// ✅ Path ถูกต้องตามโครงสร้าง: src/Admin_Pages/Admin_Component/ -> src/assets/
import LogoImage from "../../assets/Logo_fitcity.png"; 

// [เพิ่ม] Interface สำหรับ Props ของ Sidebar
interface SidebarProps {
    activeKey?: string;
    adminName?: string;
    adminEmail?: string;
    onMenuClick?: (key: string) => void; // Assuming key is a string
    onSignOut?: () => void;
}

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, key: "dashboard" }, 
  { name: "Destination Management", icon: MapPin, key: "destinations" }, 
  { name: "Destination Request", icon: BookOpen, key: "requests" }, 
  { name: "Reporting", icon: Database, key: "reporting" }, 
  { name: "Account Management", icon: User, key: "accounts" }, 
];

const sidebarBgColor = "bg-[#006064]"; 
const activePillColor = "bg-[#FFFFDE]";
// ✅ ใช้ font-sans ที่ดูสะอาดตาตามรูปภาพ
const fontClass = "font-sans";

const Sidebar: React.FC<SidebarProps> = ({ // [แก้ไข] กำหนด Type ให้ Props
    activeKey = "dashboard", 
    adminName = "Seren Vale", 
    adminEmail = "Seren.Vale@gmail.com", 
    onMenuClick, 
    onSignOut 
}) => {

  return (
    <aside className={`w-72 flex flex-col h-screen ${sidebarBgColor} text-white shadow-xl ${fontClass} shrink-0`}>
      
      {/* 1. Logo / Brand Section */}
      <div className="flex flex-col items-start px-6 py-6 pb-4">
        <div className="flex items-center space-x-2">
            <img 
                src={LogoImage} 
                alt="FitCity Logo" 
                className="w-30 h-20 opacity-80" 
                
            /> 
        </div>
      </div>

      {/* 2. Menu Items */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = item.key === activeKey;

          return (
            <div key={item.key} className="relative">
              <button
                onClick={() => onMenuClick && onMenuClick(item.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-full transition duration-150 ease-in-out
                  ${isActive 
                    ? `text-[#1E1E1E] ${activePillColor} shadow-md` 
                    : "text-white/80 hover:bg-white/10"
                  }
                `}
              >
                <Icon size={24} className="shrink-0" />
                <span className="text-base whitespace-nowrap text-left">{item.name}</span>
              </button>
            </div>
          );
        })}
      </nav>

      {/* 3. User Profile Section */}
      <div className="p-4">
        <div className="flex items-center space-x-3 p-3 bg-white text-black rounded-xl shadow-lg">
          
          <div className="w-10 h-10 flex items-center justify-center text-sm font-bold shrink-0">
            <User size={24} className="text-gray-600" /> 
          </div>
          
          <div className="flex-1 min-w-0 flex flex-col items-start">
            <p className="text-sm font-bold truncate">{adminName}</p> 
            <p className="text-xs text-gray-500 truncate">@{adminEmail}</p> 
          </div>

          <button
            onClick={onSignOut}
            className="text-gray-500 hover:text-red-600 transition p-1"
            title="Sign Out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;