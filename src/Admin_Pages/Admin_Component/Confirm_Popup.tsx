import React from 'react';

// Type สำหรับ Props ของ ConfirmModal
export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

// Component Modal ยืนยัน
const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = "Confirm",
  cancelText = "Cancel"
}) => {
  if (!isOpen) return null;

  return (
    // องค์ประกอบ Backdrop: คลุมทั้งหน้าจอ, เพิ่ม bg-opacity-75 และ backdrop-blur-sm
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
      
      {/* องค์ประกอบ Modal Card หลัก */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 p-6">
        
        {/* หัวข้อ */}
        <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
        
        {/* ข้อความ */}
        <p className="text-gray-600 mb-6">{message}</p>
        
        {/* ปุ่มดำเนินการ */}
        <div className="flex justify-end space-x-4">
          
          {/* ปุ่มยกเลิก */}
          <button
            onClick={onCancel}
            className="px-6 py-2 text-sm font-semibold rounded-lg text-gray-700 border border-gray-300 hover:bg-gray-100 transition duration-150"
          >
            {cancelText}
          </button>
          
          {/* ปุ่มยืนยัน (สีเขียว) */}
          <button
            onClick={onConfirm}
            className="px-6 py-2 text-sm font-semibold rounded-lg text-white bg-green-500 hover:bg-green-600 transition duration-150 shadow-md"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;