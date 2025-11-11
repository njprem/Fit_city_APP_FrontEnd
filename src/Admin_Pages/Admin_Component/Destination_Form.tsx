import React, { useState, useRef, ChangeEvent, FormEvent, useEffect } from 'react';
import { Camera, Clock, X, Upload, Trash2 } from 'lucide-react'; // เพิ่ม Trash2
import ConfirmModal from '../Admin_Component/Confirm_Popup'; 

// --- 1. DEFINITIONS OF TYPES ---

// Type สำหรับข้อมูลปลายทางทั้งหมดใน State (เพิ่ม id สมมติสำหรับโหมด EDIT)
interface DestinationData {
    id?: number; // Optional ID for existing destination
    name: string;
    contact: string;
    country: string;
    city: string;
    latitude: string;
    longitude: string;
    openingTime: string;
    closingTime: string;
    description: string;
    images: string[]; 
}

// Type สำหรับ Options ใน Select
interface CountryOption {
    value: string;
    label: string;
}

// Type สำหรับ Props ของ Component หลัก
interface DestinationFormProps {
    mode: 'ADD' | 'EDIT'; // โหมดการทำงานใหม่
    initialData?: DestinationData; // ข้อมูลเริ่มต้นสำหรับโหมด EDIT
    onExit: () => void;
    onAddDestination?: (data: DestinationData) => void;
    onEditDestination?: (data: DestinationData) => void;
    onDeleteDestination?: (id: number) => void; // ฟังก์ชันสำหรับลบ
}

// --- 2. DATA ---

const countryOptions: CountryOption[] = [
    { value: 'th', label: 'Thailand' },
    { value: 'jp', label: 'Japan' },
    { value: 'us', label: 'USA' },
];

const initialDestinationState: DestinationData = {
    name: '',
    contact: '',
    country: '',
    city: '',
    latitude: '',
    longitude: '',
    openingTime: '09:00', 
    closingTime: '17:00', 
    description: '',
    images: ['', '', ''], 
};

// --- 3. MAIN COMPONENT ---

const DestinationForm: React.FC<DestinationFormProps> = ({ 
    mode, 
    initialData, 
    onExit, 
    onAddDestination, 
    onEditDestination, 
    onDeleteDestination 
}) => {
    // State
    const [formData, setFormData] = useState<DestinationData>(initialDestinationState);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); 
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // Modal สำหรับลบ
    const [isLoading, setIsLoading] = useState(false); 
    
    // Ref for file input
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Effect เพื่อโหลดข้อมูลเริ่มต้นเมื่ออยู่ในโหมด EDIT
    useEffect(() => {
        if (mode === 'EDIT' && initialData) {
            // ใช้ initialData ในการตั้งค่า State
            setFormData({
                ...initialData,
                // ตรวจสอบให้แน่ใจว่า images มี 3 slot เสมอ
                images: Array.from({ length: 3 }, (_, i) => initialData.images[i] || ''),
            });
        } else if (mode === 'ADD') {
            setFormData(initialDestinationState);
        }
    }, [mode, initialData]);

    // ฟังก์ชันจัดการการเปลี่ยนแปลงของ Input ทั้งหมด
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name as keyof DestinationData]: value }));
    }; 

    // ฟังก์ชันจัดการการอัปโหลดรูปภาพจริง (File Input Change)
    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        
        reader.onloadend = () => {
            const base64Url = reader.result as string; 
            
            setFormData(prev => {
                const newImages = [...prev.images];
                const emptyIndex = newImages.findIndex(url => url === '');
                
                if (emptyIndex !== -1) {
                    newImages[emptyIndex] = base64Url;
                }
                
                return { ...prev, images: newImages };
            });
        };
        
        reader.readAsDataURL(file);
        
        e.target.value = ''; 
    };

    // ฟังก์ชันลบรูปภาพ
    const handleImageRemove = (indexToRemove: number) => {
        setFormData(prev => {
            const newImages = [...prev.images];
            
            for (let i = indexToRemove; i < newImages.length - 1; i++) {
                newImages[i] = newImages[i + 1];
            }
            newImages[newImages.length - 1] = ''; 

            return { ...prev, images: newImages };
        });
    };
    
    // ฟังก์ชันที่ถูกเรียกเมื่อกดปุ่ม "DONE" (เปิด Modal ยืนยัน บันทึก/แก้ไข)
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setIsConfirmModalOpen(true); 
    };

    // ฟังก์ชันที่ถูกเรียกเมื่อผู้ใช้ยืนยันการบันทึก/แก้ไข
    const handleConfirmSave = () => {
        setIsConfirmModalOpen(false); 
        setIsLoading(true);
        
        console.log(`Executing ${mode} with data:`, formData);
        
        setTimeout(() => {
            setIsLoading(false);
            if (mode === 'ADD' && onAddDestination) {
                onAddDestination(formData);
            } else if (mode === 'EDIT' && onEditDestination) {
                onEditDestination(formData);
            }
            onExit(); 
        }, 1000); 
    };

    // ฟังก์ชันที่ถูกเรียกเมื่อผู้ใช้ยืนยันการลบ
    const handleConfirmDelete = () => {
        setIsDeleteModalOpen(false); 
        setIsLoading(true);
        
        if (formData.id === undefined) {
             console.error("Cannot delete: Destination ID is missing.");
             setIsLoading(false);
             return;
        }

        console.log('Deleting Destination ID:', formData.id);
        
        setTimeout(() => {
            setIsLoading(false);
            if (onDeleteDestination && formData.id !== undefined) {
                onDeleteDestination(formData.id);
            }
            onExit(); 
        }, 1000); 
    };

    const handleExit = () => {
        onExit();
    };

    const isMaxImages: boolean = !formData.images.includes('');

    // Component สำหรับ Image Slot ที่แสดงรูปภาพและปุ่มลบ (ถูกย้ายเข้ามา)
    const ImageSlot: React.FC<{ index: number, imageUrl: string, onRemove: (index: number) => void }> = ({ index, imageUrl, onRemove }) => (
        <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-300 shadow-sm">
            {imageUrl ? (
                <>
                    <img 
                        src={imageUrl} 
                        alt={`Destination image ${index + 1}`} 
                        className="w-full h-full object-cover"
                    />
                    <button 
                        type="button" 
                        onClick={() => onRemove(index)}
                        className="absolute top-0 right-0 bg-red-500 hover:bg-red-600 text-white rounded-bl-lg p-[2px] transition"
                        title="Remove image"
                    >
                        <X size={12} strokeWidth={3} />
                    </button>
                </>
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs">
                    Slot {index + 1}
                </div>
            )}
        </div>
    );

    // ฟังก์ชันช่วยสำหรับการสร้าง Input/Select Field ใน JSX
    const renderInput = (label: string, name: keyof DestinationData, type: 'text' | 'number' = 'text', step?: string) => (
        <div className="flex flex-col space-y-2">
            <label htmlFor={name} className="text-gray-700 font-semibold text-sm">{label}</label>
            <input
                id={name}
                type={type}
                name={name}
                value={formData[name]}
                onChange={handleChange as (e: ChangeEvent<HTMLInputElement>) => void} 
                placeholder={`Enter ${label}`}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-[#006064] focus:border-[#006064] transition duration-150 shadow-sm"
                step={step}
            />
        </div>
    );

    const renderSelect = (label: string, name: keyof DestinationData) => (
        <div className="flex flex-col space-y-2">
            <label htmlFor={name} className="text-gray-700 font-semibold text-sm">{label}</label>
            <select 
                id={name}
                name={name} 
                value={formData[name]} 
                onChange={handleChange as (e: ChangeEvent<HTMLSelectElement>) => void}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-[#006064] focus:border-[#006064] transition duration-150 shadow-sm"
            >
                <option value="">-- Select Country --</option>
                {countryOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );

    const renderTimeInput = (label: string, name: keyof DestinationData) => (
        <div className="flex flex-col space-y-2">
            <label htmlFor={name} className="text-gray-700 font-semibold text-sm">{label}</label>
            <div className="relative">
                <input
                    id={name}
                    type="time"
                    name={name}
                    value={formData[name]}
                    onChange={handleChange as (e: ChangeEvent<HTMLInputElement>) => void} 
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-xl focus:ring-[#006064] focus:border-[#006064] appearance-none transition duration-150 shadow-sm"
                />
                <Clock size={18} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
        </div>
    );
    
    // ตั้งค่า Title และ Confirm Message ตามโหมด
    const title = mode === 'ADD' ? 'Add New Destination' : 'Edit Destination Details';
    const confirmMessage = mode === 'ADD' 
        ? 'Are you sure you want to add this destination? Please ensure all details are correct.'
        : 'Are you sure you want to save changes to this destination?';

    return (
        <form onSubmit={handleSubmit} className="p-8 space-y-6 pb-24 relative"> 
            
            {/* Header with optional Delete Button */}
            <div className="flex justify-between items-center border-b pb-3 mb-6">
                <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
                
                {/* Delete Button (แสดงเฉพาะโหมด EDIT) */}
                {mode === 'EDIT' && (
                    <button 
                        type="button" 
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition duration-150 shadow-md"
                        title="Delete Destination"
                    >
                        <Trash2 size={24} strokeWidth={2.5} />
                    </button>
                )}
            </div>

            {/* 1. File Input ที่ซ่อนอยู่สำหรับการอัปโหลดจริง */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                style={{ display: 'none' }}
                multiple={false}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 2. Name and Contact (Col 1 & 2) */}
                <div className="md:col-span-2 space-y-6">
                    {renderInput("Name", "name")}
                    {renderInput("Contact", "contact")}
                </div>

                {/* 3. Image Upload (Col 3) */}
                <div className="md:col-span-1 flex flex-col items-center justify-start pt-2 space-y-4">
                    <label className="text-gray-700 font-semibold text-sm w-full text-center">Upload Images (Max 3)</label>
                    <div className="relative w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center border-4 border-dashed border-gray-300">
                        {/* Placeholder Icon */}
                        <div className="w-16 h-16 text-gray-400">
                            <Camera size={64} />
                        </div>
                        {/* Add Button */}
                        <button 
                            type="button"
                            onClick={handleUploadButtonClick}
                            disabled={isMaxImages}
                            className={`absolute -top-1 -right-1 rounded-full p-1 border-2 border-white shadow-md transition
                                ${isMaxImages 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-[#006064] hover:bg-[#00796b]'
                                }
                            `}
                            title={isMaxImages ? "Max images reached" : "Upload Image"}
                        >
                            <Upload size={20} className="text-white" />
                        </button>
                    </div>
                    {/* Image Slots */}
                    <div className="flex space-x-2">
                        {formData.images.map((url, index) => (
                            <ImageSlot 
                                key={index} 
                                index={index} 
                                imageUrl={url} 
                                onRemove={handleImageRemove}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* 4. Location Details (2 Columns) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderSelect("Country", "country")}
                {renderInput("City", "city")}
            </div>

            {/* 5. Coordinates (2 Columns) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderInput("Latitude", "latitude", "number", "any")}
                {renderInput("Longitude", "longitude", "number", "any")}
            </div>

            {/* 6. Time (2 Columns) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderTimeInput("Opening Time", "openingTime")}
                {renderTimeInput("Closing Time", "closingTime")}
            </div>

            {/* 7. Description (Full Width - ใช้ textarea โดยตรงเหมือนเดิม) */}
            <div className="flex flex-col space-y-2">
                <label htmlFor="description" className="text-gray-700 font-semibold text-sm">Description</label>
                <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange as (e: ChangeEvent<HTMLTextAreaElement>) => void} 
                    rows={4}
                    placeholder="Enter detailed description of the destination..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#006064] focus:border-[#006064] transition duration-150 shadow-sm resize-none"
                />
            </div>

            {/* 8. Action Buttons */}
            <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200">
                <button 
                    type="submit" 
                    disabled={isLoading}
                    className={`px-8 py-3 font-bold text-lg rounded-xl transition duration-150 shadow-md 
                        ${isLoading 
                            ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                            : 'bg-[#C8E6C9] text-gray-800 hover:bg-[#A5D6A7]'
                        }`}
                >
                    {isLoading ? 'Processing...' : (mode === 'ADD' ? 'DONE' : 'SAVE')}
                </button>
                
                <button 
                    type="button" 
                    onClick={handleExit} 
                    className="px-8 py-3 font-bold text-lg rounded-xl transition duration-150 shadow-md bg-black text-white hover:bg-gray-800"
                >
                    EXIT
                </button>
            </div>
            
            {/* Modal Component สำหรับ Confirm Save/Add */}
            <ConfirmModal
                isOpen={isConfirmModalOpen}
                title={mode === 'ADD' ? "Confirm Add New Destination" : "Confirm Save Changes"}
                message={confirmMessage}
                onConfirm={handleConfirmSave}
                onCancel={() => setIsConfirmModalOpen(false)}
                confirmText={mode === 'ADD' ? "Confirm" : "Save"}
                cancelText="Cancel"
            />
            
            {/* Modal Component สำหรับ Confirm Delete */}
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                title="Confirm To Delete Destination"
                message="Are you sure you want to permanently delete this destination? This action cannot be undone."
                onConfirm={handleConfirmDelete}
                onCancel={() => setIsDeleteModalOpen(false)}
                confirmText="Delete"
                cancelText="Cancel"
            />
            
        </form>
    );
};

export default DestinationForm;