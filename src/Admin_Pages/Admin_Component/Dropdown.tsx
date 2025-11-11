import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownItem {
    label: string;
    value: string;
}

interface DropdownProps {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    isFilter?: boolean; // New prop to handle filter styling/badge
}

const Dropdown: React.FC<DropdownProps> = ({ title, icon, children, className = '', isFilter = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleToggle = () => setIsOpen(!isOpen);

    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className={`relative inline-block text-left ${className}`} ref={dropdownRef} style={{ zIndex: isOpen ? 50 : 30 }}>
            <button
                type="button"
                className={`inline-flex justify-center items-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors
                    ${isFilter && 'pr-3'} 
                `}
                onClick={handleToggle}
            >
                {icon}
                <span className={`truncate ${icon ? 'ml-2' : ''}`}>{title}</span>
                <ChevronDown className="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
            </button>

            {isOpen && (
                <div
                    className="origin-top-right absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="menu-button"
                >
                    <div className="py-1" role="none">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dropdown;