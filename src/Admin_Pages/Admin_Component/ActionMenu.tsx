import React from 'react';
import { MoreVertical } from 'lucide-react';

const ActionMenu = ({ rowId, isOpen, setIsOpen }) => {
    const actions = [
        { name: 'View Detail', onClick: () => console.log(`View detail for row ${rowId}`) },
        { name: 'Edit Detail', onClick: () => console.log(`Edit detail for row ${rowId}`) },
    ];

    return (
        // 🛠️ ปรับเปลี่ยน: ใช้สไตล์ Dropdown ที่มีปุ่ม Pill Shape
        <div className="relative inline-block text-left z-10"> 
            <button
                onClick={() => setIsOpen(isOpen ? null : rowId)}
                // 🛠️ สไตล์ปุ่ม: ปรับให้เป็น Pill Shape เล็กๆ สีเทาอ่อน (คล้ายปุ่ม action)
                className="inline-flex justify-center w-full rounded-full p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-200 focus:outline-none transition shadow-sm"
            >
                <MoreVertical size={20} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div 
                    // 🛠️ ตำแหน่งและ Z-index: ชิดขวา, z-30 เพื่อให้แสดงเหนือตาราง
                    className="origin-top-right absolute right-0 mt-2 w-40 rounded-xl shadow-2xl bg-white border border-gray-100 p-1 z-30"
                >
                    {actions.map((action, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                action.onClick();
                                setIsOpen(null); // ปิดเมนูหลังจากคลิก
                            }}
                            // 🛠️ สไตล์เมนู: ปรับให้เป็น rounded-xl เหมือน Dropdown อื่นๆ
                            className="block w-full text-left px-4 py-3 text-sm text-gray-700 rounded-xl hover:bg-blue-50 transition hover:text-blue-600 font-medium"
                            role="menuitem"
                        >
                            {action.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
export default ActionMenu;