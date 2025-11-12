import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface DropdownOption {
    value: string;
    label: string;
}

export interface DropdownProps {
    name: string;
    value: string;
    options: DropdownOption[];
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({ name, value, options, onChange, placeholder = 'Select an option', className = '', disabled = false }) => {
    return (
        <div className={`relative ${className}`}>
            <select
                name={name}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className={`block w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-teal-500 focus:border-teal-500 appearance-none text-sm transition-colors
                    ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-gray-50 text-gray-700 border border-transparent hover:border-gray-300'}`}
            >
                {/* Placeholder Option */}
                {/* 💡 แก้ไข: ถ้า value เป็นค่าว่าง ('') ให้ placeholder ถูกเลือกเป็นค่าเริ่มต้น 
                  และตั้ง disabled เป็น true เพื่อไม่ให้ผู้ใช้เลือกซ้ำ แต่ถ้ามี value แล้ว ให้ disabled เป็น false 
                */}
                <option value="" disabled={!value}>
                    {placeholder}
                </option>
                
                {/* 🚀 FIX: ป้องกัน Error: ใช้ Array.isArray และตรวจสอบ options ก่อนเรียก .map() */}
                {Array.isArray(options) && options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 ${disabled ? 'opacity-50' : ''}`}>
                <ChevronDown className="h-4 w-4" />
            </div>
        </div>
    );
};

export default Dropdown;