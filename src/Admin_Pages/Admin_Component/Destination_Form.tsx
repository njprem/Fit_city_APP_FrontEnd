import React, { useState, useRef,  useEffect } from 'react';
import type {ChangeEvent, FormEvent} from 'react';
import { Camera, Clock, X, Upload, Trash2, ChevronDown } from 'lucide-react'; 
// import ConfirmModal from '../Admin_Component/Confirm_Popup'; // Removed: Parent component handles confirmation

// --- 1. DEFINITIONS OF TYPES (Updated to match Destination_Management.tsx) ---

// Type สำหรับข้อมูลปลายทางทั้งหมดใน State
export interface DestinationFormData {
    id: number | null;
    name: string;
    type: string; // เพิ่ม Type field
    contact: string;
    country: string;
    city: string;
    latitude: number | null; // เปลี่ยนเป็น number | null
    longitude: number | null; // เปลี่ยนเป็น number | null
    openingTime: string;
    closingTime: string;
    description: string;
    images: string[]; // สำหรับ initial URLs
    imageFiles?: File[]; // สำหรับ new File objects
}

// Type สำหรับ Props ของ Component หลัก
interface DestinationFormProps {
    initialData: DestinationFormData;
    viewMode: 'add' | 'edit' | 'view'; // ใช้ viewMode แทน mode
    onSave: (data: DestinationFormData, imageFiles: File[]) => void; // ฟังก์ชันบันทึกข้อมูลและ File
    onCancel: () => void; // ใช้ onCancel แทน onExit
    onDelete?: (id: number) => void; 
}

// Interface สำหรับ Props ของ ImageSlot
interface ImageSlotProps {
    index: number;
    imageUrl: string;
    onRemove: (index: number) => void;
    disabled: boolean;
}

// --- 2. DATA (Mock data required internally) ---

const formTypeOptions = [
    { value: 'Culture', label: 'Culture' },
    { value: 'Food', label: 'Food' },
    { value: 'Nature', label: 'Nature' },
    { value: 'Sport', label: 'Sport' },
];

const countryOptions = [
    { value: 'Thailand', label: 'Thailand' },
    { value: 'Japan', label: 'Japan' },
    { value: 'USA', label: 'USA' },
];

// --- 3. MAIN COMPONENT ---

const DestinationForm: React.FC<DestinationFormProps> = ({ 
    initialData, 
    viewMode, 
    onSave, 
    onCancel, 
    onDelete 
}) => {
    // State: formData และ imageFiles ถูกกำหนดค่าเริ่มต้นด้วย initialData จาก Parent
    const [formData, setFormData] = useState<DestinationFormData>(initialData);
    const [imageFiles, setImageFiles] = useState<File[]>(initialData.imageFiles || []);
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    // Ref for file input
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isViewMode = viewMode === 'view';
    const isEditMode = viewMode === 'edit';
    const isAddMode = viewMode === 'add';
    const isReadOnly = isViewMode;
    
    // Effect to update local state when initialData changes
    useEffect(() => {
        setFormData(initialData);
        setImageFiles(initialData.imageFiles || []);
        setErrors({});
    }, [initialData, viewMode]);


    // Function to handle all input changes
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        let processedValue: string | number | null = value;

        if (type === 'number') {
             // Handle number fields (Latitude, Longitude): convert to float or null if empty
            processedValue = value !== '' ? parseFloat(value) : null;
        }

        setFormData(prev => ({ 
            ...prev, 
            [name as keyof DestinationFormData]: processedValue === null && (name === 'latitude' || name === 'longitude') 
                ? null // Store as null if empty string for latitude/longitude
                : processedValue,
        }));
        
        // Clear error on change
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[name];
            return newErrors;
        });
    }; 
    
    // --- Image Handling Logic ---
    const finalImageUrls: string[] = [
        ...formData.images, // Existing URLs
        ...imageFiles.map(file => URL.createObjectURL(file)) // New File Previews
    ];

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        const maxImages = 3; 
        
        const currentTotalCount = finalImageUrls.length;
        const remainingSlots = maxImages - currentTotalCount;

        const newFiles = files.slice(0, remainingSlots);
        
        setImageFiles(prevFiles => [...prevFiles, ...newFiles]);
        
        if (fileInputRef.current) {
             fileInputRef.current.value = '';
        }
    };

    const handleImageRemove = (indexToRemove: number) => {
        const isInitialImage = indexToRemove < formData.images.length;
        
        if (isInitialImage) {
            // Remove from initialImages array
            const newInitialImages = formData.images.filter((_, index) => index !== indexToRemove);
            
            setFormData(prev => ({
                ...prev,
                images: newInitialImages, // ส่ง list ที่ถูกลบไปให้ Parent/API จัดการ
            }));

        } else {
            // Item is a newly added File object
            const fileIndex = indexToRemove - formData.images.length;

            setImageFiles(prevFiles => {
                const updatedFiles = prevFiles.filter((_, index) => index !== fileIndex);
                return updatedFiles;
            });
            
            // Cleanup Object URL
            const removedFileUrl = finalImageUrls[indexToRemove];
            if (removedFileUrl && !formData.images.includes(removedFileUrl)) {
                 URL.revokeObjectURL(removedFileUrl);
            }
        }
    };
    
    const handleUploadButtonClick = () => {
        if (fileInputRef.current && !isReadOnly) {
            fileInputRef.current.click();
        }
    };
    
    // --- Validation and Submission ---
    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.name) newErrors.name = 'Destination Name is required.';
        if (!formData.type) newErrors.type = 'Type is required.'; 
        
        const sanitizedContact = formData.contact.replace(/[^\d+]/g, ''); 
        if (!formData.contact || sanitizedContact.length < 5) newErrors.contact = 'Valid Contact number is required (min 5 characters).';
        
        if (!formData.country) newErrors.country = 'Country is required.';
        if (!formData.city) newErrors.city = 'City is required.';
        
        // Validation for number|null fields
        if (formData.latitude === null || isNaN(formData.latitude)) newErrors.latitude = 'Valid Latitude is required.';
        if (formData.longitude === null || isNaN(formData.longitude)) newErrors.longitude = 'Valid Longitude is required.';
        
        if (!formData.openingTime) newErrors.openingTime = 'Opening Time is required.';
        if (!formData.closingTime) newErrors.closingTime = 'Closing Time is required.';
        
        if (!formData.description) newErrors.description = 'Description is required.';
        
        // Image validation
        if ((isAddMode || isEditMode) && formData.images.length === 0 && imageFiles.length === 0) newErrors.images = 'At least one image is required.';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (isViewMode) return;
        
        if (validate()) {
            // ส่งข้อมูลและ File objects ให้ Parent (Destination_Management) จัดการต่อ
            onSave(formData, imageFiles);
        } else {
             console.error('Validation failed', errors);
        }
    };

    // --- Sub-Component: ImageSlot (defined locally for simplicity) ---
    const ImageSlot: React.FC<ImageSlotProps> = ({ index, imageUrl, onRemove, disabled }) => (
        <div 
            key={index}
            className={`relative w-full aspect-square bg-gray-200 rounded-md flex items-center justify-center overflow-hidden
                ${imageUrl ? 'border border-gray-300' : 'border-2 border-dashed border-gray-200'}`}
        >
            {imageUrl ? (
                <>
                    <img src={imageUrl} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                    {!disabled && (
                        <button
                            type="button"
                            onClick={() => onRemove(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                            aria-label="Remove Image"
                        >
                            <X size={12} strokeWidth={3} />
                        </button>
                    )}
                </>
            ) : (
                <span className="text-gray-400 text-xs">Slot {index + 1}</span>
            )}
        </div>
    );
    // --- JSX Render Helpers ---
    // Helper function for rendering Input fields
    const renderInput = (label: string, name: keyof DestinationFormData, type: 'text' | 'number' | 'time' = 'text', step?: string) => (
        <div className="flex flex-col space-y-2">
            <label htmlFor={name} className="text-gray-700 font-semibold text-sm">{label} {isReadOnly ? '' : <span className="text-red-500">*</span>}</label>
            <div className="relative">
                <input
                    id={name}
                    type={type}
                    name={name}
                    // Handle number fields correctly, displaying '' for null
                    value={typeof formData[name] === 'number' && (formData[name] as number) === null ? '' : formData[name] as string | number} 
                    onChange={handleChange as (e: ChangeEvent<HTMLInputElement>) => void} 
                    placeholder={`Enter ${label}`}
                    className={`w-full px-4 py-2 border rounded-xl focus:ring-[#006064] focus:border-[#006064] transition duration-150 shadow-sm
                        ${isReadOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : errors[name] ? 'border-red-500' : 'border-gray-300'}
                    `}
                    step={step}
                    disabled={isReadOnly}
                    {...(type === 'time' && { className: `w-full px-4 py-2 pr-10 border rounded-xl focus:ring-[#006064] focus:border-[#006064] appearance-none transition duration-150 shadow-sm ${isReadOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : errors[name] ? 'border-red-500' : 'border-gray-300'}` })}
                />
                {type === 'time' && <Clock size={18} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />}
            </div>
            {errors[name] && <p className="mt-1 text-xs text-red-500">{errors[name]}</p>}
        </div>
    );

    // Helper function for rendering Select fields
    const renderSelect = (label: string, name: keyof DestinationFormData, options: { value: string; label: string; }[]) => (
        <div className="flex flex-col space-y-2">
            <label htmlFor={name} className="text-gray-700 font-semibold text-sm">{label} {isReadOnly ? '' : <span className="text-red-500">*</span>}</label>
            <div className="relative">
                <select 
                    id={name}
                    name={name} 
                    value={formData[name] as string} 
                    onChange={handleChange as (e: ChangeEvent<HTMLSelectElement>) => void}
                    className={`w-full px-4 py-2 border rounded-xl focus:ring-[#006064] focus:border-[#006064] transition duration-150 shadow-sm appearance-none
                        ${isReadOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : errors[name] ? 'border-red-500' : 'border-gray-300'}
                    `}
                    disabled={isReadOnly}
                >
                    <option value="">-- Select {label} --</option>
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 ${isReadOnly ? 'opacity-50' : ''}`}>
                    <ChevronDown size={18} className="h-4 w-4" />
                </div>
            </div>
            {errors[name] && <p className="mt-1 text-xs text-red-500">{errors[name]}</p>}
        </div>
    );


    // --- Main Render ---
    const title = isAddMode ? 'Add New Destination' : (isEditMode ? 'Edit Destination Details' : 'View Destination Details');

    return (
        <div className="p-8 space-y-6 pb-24 relative bg-white rounded-xl shadow-lg"> 
            
            {/* Header with optional Delete Button */}
            <div className="flex justify-between items-center border-b pb-3 mb-6">
                <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
                
                {/* Delete Button (แสดงเฉพาะโหมด EDIT) */}
                {isEditMode && formData.id !== null && (
                    <button 
                        type="button" 
                        onClick={() => { if (onDelete && formData.id !== null) onDelete(formData.id); }} // Call onDelete prop
                        className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition duration-150 shadow-md"
                        title="Delete Destination"
                    >
                        <Trash2 size={24} strokeWidth={2.5} />
                    </button>
                )}
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Left/Middle Column (Main Fields) - Spans 2/3 */}
                    <div className="md:col-span-2 space-y-6">
                        {renderInput("Destination Name", "name")}
                        {renderSelect("Type", "type", formTypeOptions)} 
                        {renderInput("Contact", "contact")}
                    </div>

                    {/* Right Column (Images) - Spans 1/3 */}
                    <div className="md:col-span-1 flex flex-col items-center justify-start pt-2 space-y-4 border p-4 rounded-xl bg-gray-50 h-full">
                        <label className="text-gray-700 font-semibold text-sm w-full text-center">Upload Images (Max 3) {isReadOnly ? '' : <span className="text-red-500">*</span>}</label>
                        
                        {/* Hidden File Input (Essential for selection) */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            multiple
                            className="hidden"
                            disabled={isReadOnly || finalImageUrls.length >= 3}
                        />

                        <div className="relative w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center border-4 border-dashed border-gray-300">
                            <div className="w-16 h-16 text-gray-400">
                                <Camera size={64} />
                            </div>
                            
                            {/* Add Button */}
                            {!isReadOnly && finalImageUrls.length < 3 && (
                                <button 
                                    type="button"
                                    onClick={handleUploadButtonClick} 
                                    className="absolute -top-1 -right-1 rounded-full p-1 border-2 border-white shadow-md transition bg-[#006064] hover:bg-[#00796b]"
                                    title="Upload Image"
                                >
                                    <Upload size={20} className="text-white" />
                                </button>
                            )}
                        </div>
                        
                        {/* Image Slots */}
                        <div className="grid grid-cols-3 gap-2 w-full">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <ImageSlot 
                                    key={index} 
                                    index={index} 
                                    imageUrl={finalImageUrls[index]} 
                                    onRemove={handleImageRemove}
                                    disabled={isReadOnly}
                                />
                            ))}
                        </div>
                        {errors.images && <p className="mt-1 text-xs text-red-500 w-full text-center">{errors.images}</p>}
                    </div>
                </div>

                {/* Location Details & Coordinates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderSelect("Country", "country", countryOptions)}
                    {renderInput("City", "city")}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderInput("Latitude", "latitude", "number", "any")}
                    {renderInput("Longitude", "longitude", "number", "any")}
                </div>

                {/* Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderInput("Opening Time", "openingTime", "time")}
                    {renderInput("Closing Time", "closingTime", "time")}
                </div>

                {/* Description */}
                <div className="flex flex-col space-y-2">
                    <label htmlFor="description" className="text-gray-700 font-semibold text-sm">Description {isReadOnly ? '' : <span className="text-red-500">*</span>}</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange as (e: ChangeEvent<HTMLTextAreaElement>) => void} 
                        rows={4}
                        placeholder="Enter detailed description of the destination..."
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-[#006064] focus:border-[#006064] transition duration-150 shadow-sm resize-none
                            ${isReadOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : errors.description ? 'border-red-500' : 'border-gray-300'}
                        `}
                        disabled={isReadOnly}
                    />
                     {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200">
                    {!isReadOnly && (
                        <button 
                            type="submit" 
                            className={`px-8 py-3 font-bold text-lg rounded-xl transition duration-150 shadow-md 
                                bg-[#C8E6C9] text-gray-800 hover:bg-[#A5D6A7]`
                            }
                        >
                            {isAddMode ? 'DONE' : 'SAVE'}
                        </button>
                    )}
                    
                    <button 
                        type="button" 
                        onClick={onCancel} // Call onCancel prop
                        className="px-8 py-3 font-bold text-lg rounded-xl transition duration-150 shadow-md bg-black text-white hover:bg-gray-800"
                    >
                        EXIT
                    </button>
                </div>
            </form>
            
            {/* Confirmation Modals are handled by the PARENT component */}
            
        </div>
    );
};

export default DestinationForm;