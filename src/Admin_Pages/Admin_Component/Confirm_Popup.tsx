import React from 'react';
import { Check, X } from 'lucide-react';

export interface ConfirmPopupProps {
    isVisible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    confirmButtonClass?: string;
}

const ConfirmPopup: React.FC<ConfirmPopupProps> = ({
    isVisible,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmButtonClass = 'bg-red-600 hover:bg-red-700'
}) => {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black/10 backdrop-brightness-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
                <p className="text-gray-600 mb-6">{message}</p>
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onCancel}
                        className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors shadow-sm"
                    >
                        <X className="w-4 h-4 mr-1" /> {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex items-center px-4 py-2 text-white rounded-lg transition-colors shadow-md ${confirmButtonClass}`}
                    >
                        <Check className="w-4 h-4 mr-1" /> {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmPopup;
