import React, { useRef, useEffect } from 'react';
import { MoreVertical, Eye, Edit } from 'lucide-react';

export interface ActionOption {
    value: string;
    label: string;
    action: () => void;
}

export interface ActionMenuProps {
    options: ActionOption[];
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
}

const ActionMenu: React.FC<ActionMenuProps> = ({ options, isOpen, onToggle, onClose }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    const handleAction = (action: () => void) => {
        action();
        onClose();
    };

    return (
        <div className="relative inline-block text-left" ref={menuRef}>
            <div>
                <button
                    type="button"
                    className="inline-flex justify-center items-center rounded-full bg-white p-1 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none transition-colors"
                    onClick={onToggle}
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                >
                    <MoreVertical className="h-5 w-5" />
                </button>
            </div>

            {isOpen && (
                <div
                    className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-gray-200 focus:outline-none z-10"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="menu-button"
                    tabIndex={-1}
                >
                    <div className="py-1" role="none">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => handleAction(option.action)}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
                                role="menuitem"
                                tabIndex={-1}
                            >
                                {option.value === 'view' && <Eye className="h-4 w-4 mr-2" />}
                                {option.value === 'edit' && <Edit className="h-4 w-4 mr-2" />}
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActionMenu;
