import React, { useRef, useEffect } from 'react'; // [แก้ไข] เพิ่ม useRef, useEffect
import { MoreVertical } from 'lucide-react';

// [เพิ่ม] Interface สำหรับ ActionOption
interface ActionOption {
    name: string;
    onClick: () => void;
}

// [เพิ่ม] Interface สำหรับ Props ของ ActionMenu
interface ActionMenuProps {
    rowId: number; // ID ของแถวปัจจุบัน (สำหรับระบุว่าเมนูนี้เป็นของแถวไหน)
    isOpen: boolean; // สถานะว่าเมนูนี้เปิดอยู่หรือไม่
    setIsOpen: (id: number | null) => void; // Setter จาก Parent เพื่อบอกว่าแถวไหนที่เปิดเมนูอยู่
    actions?: ActionOption[]; // Optional: สามารถส่งรายการ Action เข้ามาได้
}

const ActionMenu: React.FC<ActionMenuProps> = ({ rowId, isOpen, setIsOpen, actions: propActions }) => { // [แก้ไข] กำหนด Type ให้ Props
    const menuRef = useRef<HTMLDivElement>(null);

    // ใช้ actions ที่ส่งมาจาก props หรือใช้ค่า default
    const actions = propActions || [
        { name: 'View Detail', onClick: () => console.log(`View detail for row ${rowId}`) },
        { name: 'Edit Detail', onClick: () => console.log(`Edit detail for row ${rowId}`) },
    ];
    
    // [เพิ่ม] Logic สำหรับ Click Outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isOpen && menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(null); // ปิดเมนูทุกแถว
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, setIsOpen]);

    return (
        // 🛠️ ปรับเปลี่ยน: ใช้สไตล์ Dropdown ที่มีปุ่ม Pill Shape
        <div className="relative inline-block text-left z-10" ref={menuRef}> 
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