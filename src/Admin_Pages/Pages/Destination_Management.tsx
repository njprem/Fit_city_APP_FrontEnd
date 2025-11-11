import React, { useState, useMemo, ChangeEvent, FormEvent, useRef, useEffect } from 'react';
import { Plus, MoreVertical, Eye, Edit, Trash2, ChevronDown, Check, X, Search, Filter, ArrowDownWideNarrow, SlidersHorizontal, Camera } from 'lucide-react'; 

// ***************************************************************
// 1. SearchBar Component
// ***************************************************************
export interface SearchBarProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    onSearch: () => void;
    placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, setSearchTerm, onSearch, placeholder = 'Find Destination Name or ID...' }) => {
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            onSearch();
        }
    };

    return (
        <div className="relative flex w-full max-w-xl">
            <input
                type="text"
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyPress}
                className="w-full pl-4 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-shadow"
            />
            <button
                onClick={onSearch}
                className="absolute right-0 top-0 h-full w-10 text-gray-500 flex items-center justify-center hover:text-indigo-600 transition-colors"
            >
                <Search className="w-5 h-5" />
            </button>
        </div>
    );
};


// #region Dropdown Component
interface DropdownOption {
    value: string;
    label: string;
}

interface DropdownProps {
    name: string;
    value: string;
    options: DropdownOption[];
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean; // Added disabled prop
}

const Dropdown: React.FC<DropdownProps> = ({ name, value, options, onChange, placeholder = 'Select an option', className = '', disabled = false }) => {
    return (
        <div className={`relative ${className}`}>
            <select
                name={name}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled} // Apply disabled prop
                className={`block w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-teal-500 focus:border-teal-500 appearance-none text-sm transition-colors
                    ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-gray-50 text-gray-700 border border-transparent hover:border-gray-300'}`}
            >
                <option value="" disabled={!value}>
                    {placeholder}
                </option>
                {options.map((option) => (
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
// #endregion Dropdown Component

// #region ConfirmPopup Component
interface ConfirmPopupProps {
    isVisible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string; // New prop for custom confirm button text
    cancelText?: string;  // New prop for custom cancel button text
    confirmButtonClass?: string; // New prop for custom confirm button class
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
// #endregion ConfirmPopup Component


// ... (omitted imports and other components)

// #region ImageUploader Component
interface ImageUploaderProps {
    initialImages: string[]; // URLs or base64 for initial images
    onImagesChange: (files: File[]) => void;
    maxImages?: number;
    disabled?: boolean; // New prop to disable interaction
    viewMode: 'list' | 'add' | 'edit' | 'view'; // <<-- [แก้ไขที่ 1] เพิ่ม viewMode
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ initialImages, onImagesChange, maxImages = 3, disabled = false, viewMode }) => { // <<-- [แก้ไขที่ 2] รับ viewMode เข้ามา
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null); // Reference to the actual hidden file input

    useEffect(() => {
        // When initialImages change (e.g., loading edit data), update previews
        if (initialImages && initialImages.length > 0) {
            // For now, just set them as previews
            setImagePreviews(initialImages);
            // NOTE: Keep imageFiles clear when loading initial URLs from mock/backend.
            // When user selects a new file, it will be added to imageFiles.
            // If the user is editing, we assume initialImages are old and new files are in imageFiles.
            setImageFiles([]); 
        } else {
            setImagePreviews([]);
            setImageFiles([]);
        }
    }, [initialImages]);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (disabled) return;

        const files = Array.from(event.target.files || []);
        
        // This is where we separate the current previews (which might include initial URLs)
        // from the actual file objects (which are new user selections).
        // Let's ensure we only keep the actual File objects that were previously selected
        // and add the new ones, keeping track of the total limit for previews.
        
        const currentFileCount = imageFiles.length;
        const remainingSlots = maxImages - currentFileCount;

        const newFiles = files.slice(0, remainingSlots);
        
        const updatedImageFiles = [...imageFiles, ...newFiles];

        // Update previews: current initial previews + new file previews
        const newFilePreviews = newFiles.map(file => URL.createObjectURL(file));
        const updatedImagePreviews = [...initialImages, ...newFilePreviews];
        
        setImageFiles(updatedImageFiles);
        setImagePreviews(updatedImagePreviews);
        onImagesChange(updatedImageFiles); // Notify parent of actual File objects
        
        // IMPORTANT: Reset the file input value to allow the same file to be selected again
        if (fileInputRef.current) {
             fileInputRef.current.value = '';
        }
    };

    const handleRemoveImage = (indexToRemove: number) => {
        if (disabled) return;

        // If the indexToRemove is one of the initial images (URLs), we simply remove its preview
        // but we don't modify imageFiles state. If it's a file from imageFiles, we remove both.
        
        // Check if the item being removed is an initial/pre-existing URL or a newly added File object
        const isInitialImage = indexToRemove < initialImages.length;

        if (isInitialImage) {
            // Remove from initialImages array and update previews
            const newInitialImages = initialImages.filter((_, index) => index !== indexToRemove);
            
            // Re-render previews based on the new initial set and current files
            const newFilePreviews = imageFiles.map(file => URL.createObjectURL(file));
            setImagePreviews([...newInitialImages, ...newFilePreviews]);
            
            // This is a complex scenario: removing an initial image is usually handled by the parent component
            // to tell the backend to delete it. For simplicity in the component, we just remove the preview.
            // In a real application, you would need to track which initial images are marked for deletion.
            console.log(`Initial image at index ${indexToRemove} removed from preview. Parent component should handle backend deletion.`);

        } else {
            // Item is a newly added File object (index relative to imageFiles)
            const fileIndex = indexToRemove - initialImages.length;

            const updatedFiles = imageFiles.filter((_, index) => index !== fileIndex);
            
            // Revoke Object URL for the specific file object to free up memory
            const removedFileUrl = imagePreviews[indexToRemove];
            if (removedFileUrl && !initialImages.includes(removedFileUrl)) {
                 URL.revokeObjectURL(removedFileUrl);
            }
            
            const updatedPreviews = imagePreviews.filter((_, index) => index !== indexToRemove);

            setImageFiles(updatedFiles);
            setImagePreviews(updatedPreviews);
            onImagesChange(updatedFiles);
        }
    };

    const triggerFileInput = () => {
        if (fileInputRef.current && !disabled) {
            fileInputRef.current.click();
        }
    };

    // Correctly determine which previews to show: initial (URLs) first, then new files
    const finalPreviews = [...initialImages, ...imageFiles.map(file => URL.createObjectURL(file))];

    return (
        <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Images (Max {maxImages})</label>
            <div className="flex flex-col items-center justify-center p-4 border border-gray-300 rounded-lg bg-gray-50 h-full">

                {/* Hidden File Input (Essential for selection) */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={disabled}
                />
                
                {finalPreviews.length < maxImages && !disabled && (
                    <button
                        type="button"
                        onClick={triggerFileInput} // This calls the click method on the hidden input
                        className="flex flex-col items-center justify-center p-4 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors mb-4 border-2 border-dashed border-gray-300 w-full h-32"
                    >
                        <Camera className="w-8 h-8 text-gray-400" />
                        <span className="mt-2 text-sm text-gray-600">Add Image</span>
                    </button>
                )}

                <div className="grid grid-cols-3 gap-3 w-full">
                    {Array.from({ length: maxImages }).map((_, index) => (
                        <div
                            key={index}
                            className={`relative w-full aspect-square bg-gray-200 rounded-md flex items-center justify-center overflow-hidden
                                ${finalPreviews[index] ? 'border border-gray-300' : 'border-2 border-dashed border-gray-200'}`}
                        >
                            {finalPreviews[index] ? (
                                <>
                                    <img src={finalPreviews[index]} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                                    {!disabled && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImage(index)}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                            aria-label="Remove Image"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </>
                            ) : (
                                <span className="text-gray-400 text-xs">Slot {index + 1}</span>
                            )}
                        </div>
                    ))}
               </div>
            </div>
            {/* Added error display here for images */}
            {finalPreviews.length === 0 && (viewMode === 'add' || viewMode === 'edit') && ( // <<-- ตรงนี้จะหาย Error แล้ว
                <p className="mt-1 text-xs text-red-500">At least one image is required.</p>
            )}
        </div>
    );
};
// #endregion ImageUploader Component

// ... (omitted the rest of the file)

// #region DestinationForm Component
export interface DestinationFormData {
    id: number | null;
    name: string;
    type: string;    
    contact: string; // Stays as string to allow prefixes like '+' or spaces/hyphens
    country: string; 
    city: string;    
    latitude: number | null; 
    longitude: number | null; 
    openingTime: string; 
    closingTime: string; 
    description: string;
    // Removed price and durationDays
    images: string[]; // For initial display (URLs)
    imageFiles?: File[]; // For actual file objects to be uploaded
}

export const emptyDestinationInitialData: DestinationFormData = {
    id: null,
    name: '',
    type: '', 
    contact: '',
    country: '',
    city: '',
    latitude: null,
    longitude: null,
    openingTime: '09:00', 
    closingTime: '17:00', 
    description: '',
    images: [],
    imageFiles: [],
};

// Mock data for edit and view
export const mockEditDestinationData: DestinationFormData = {
    id: 1,
    name: 'France: Hands-On Cooking Class with Pâtisserie Chef Noémie',
    type: 'Food', 
    contact: '+33123456789', // Example contact with prefix
    country: 'France',
    city: 'Paris',
    latitude: 48.8566,
    longitude: 2.3522,
    openingTime: '09:30',
    closingTime: '16:00',
    description: 'A 3-day immersive culinary experience in Paris focusing on classic French pastry techniques, led by renowned chef Noémie. Includes market visits and final tasting.',
    images: ['https://via.placeholder.com/150/FF5733/FFFFFF?text=FrenchDish', 'https://via.placeholder.com/150/33FF57/FFFFFF?text=NoemieChef'],
};

export const mockViewDestinationData: DestinationFormData = {
    id: 101,
    name: 'Japan: Kyoto Ancient Temples & Matcha Ceremony',
    type: 'Culture', 
    contact: '0901234567',
    country: 'Japan',
    city: 'Kyoto',
    latitude: 35.0116,
    longitude: 135.7681,
    openingTime: '08:00',
    closingTime: '18:00',
    description: 'A serene journey through Kyoto\'s historic temples, tranquil gardens, and an authentic matcha tea ceremony. Experience the rich culture and spiritual heritage of Japan.',
    images: ['https://via.placeholder.com/150/3498DB/FFFFFF?text=KyotoTemple', 'https://via.placeholder.com/150/2ECC71/FFFFFF?text=Matcha'],
};

interface DestinationFormProps {
    initialData: DestinationFormData;
    viewMode: 'add' | 'edit' | 'view'; 
    onSave: (data: DestinationFormData, imageFiles: File[]) => void;
    onCancel: () => void;
    onDelete?: (id: number) => void; 
}

const DestinationForm: React.FC<DestinationFormProps> = ({ initialData, viewMode, onSave, onCancel, onDelete }) => {
    const [formData, setFormData] = useState<DestinationFormData>(initialData);
    const [imageFiles, setImageFiles] = useState<File[]>(initialData.imageFiles || []);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Update formData and imageFiles when initialData or viewMode changes
    useEffect(() => {
        setFormData(initialData);
        setImageFiles(initialData.imageFiles || []);
        setErrors({}); // Clear errors on mode/data change
    }, [initialData, viewMode]);

    const isViewMode = viewMode === 'view';
    const isEditMode = viewMode === 'edit';
    const isAddMode = viewMode === 'add';

    const formTypeOptions = [
        { value: 'Culture', label: 'Culture' },
        { value: 'Food', label: 'Food' },
        { value: 'Nature', label: 'Nature' },
        { value: 'Sport', label: 'Sport' },
    ];
    
    // Mock country/city options
    const countryOptions = [
        { value: 'Japan', label: 'Japan' },
        { value: 'France', label: 'France' },
        { value: 'Thailand', label: 'Thailand' },
        { value: 'USA', label: 'USA' },
    ];

    const cityOptions = {
        'Japan': [{ value: 'Tokyo', label: 'Tokyo' }, { value: 'Kyoto', label: 'Kyoto' }],
        'France': [{ value: 'Paris', label: 'Paris' }, { value: 'Nice', label: 'Nice' }],
        'Thailand': [{ value: 'Bangkok', label: 'Bangkok' }, { value: 'Chiang Mai', label: 'Chiang Mai' }],
        'USA': [{ value: 'New York', label: 'New York' }, { value: 'Los Angeles', label: 'Los Angeles' }],
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        let processedValue: string | number | null = value;

        if (type === 'number') {
            processedValue = value !== '' ? parseFloat(value) : null;
        } else if (name === 'contact') {
            // Soft validation for Contact: allow digits, spaces, hyphens, and '+' at start
            // The value is stored as a string.
            processedValue = value;
        }

        setFormData(prev => ({
            ...prev,
            [name]: processedValue === null && (name === 'latitude' || name === 'longitude') ? null : processedValue,
        }));
        
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[name];
            return newErrors;
        });
    };

    const handleImagesChange = (files: File[]) => {
        setImageFiles(files);
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.name) newErrors.name = 'Destination Name is required.';
        if (!formData.type) newErrors.type = 'Type is required.'; 
        
        // Basic contact validation: not empty and contains at least one digit
        const sanitizedContact = formData.contact.replace(/[^\d+]/g, ''); // Remove all non-digits except '+'
        if (!formData.contact || sanitizedContact.length < 5) newErrors.contact = 'Valid Contact number is required (min 5 characters).';
        
        if (!formData.country) newErrors.country = 'Country is required.';
        if (!formData.city) newErrors.city = 'City is required.';
        if (formData.latitude === null || isNaN(formData.latitude)) newErrors.latitude = 'Valid Latitude is required.';
        if (formData.longitude === null || isNaN(formData.longitude)) newErrors.longitude = 'Valid Longitude is required.';
        if (!formData.openingTime) newErrors.openingTime = 'Opening Time is required.';
        if (!formData.closingTime) newErrors.closingTime = 'Closing Time is required.';
        if (!formData.description) newErrors.description = 'Description is required.';
        if (isAddMode && imageFiles.length === 0 && formData.images.length === 0) newErrors.images = 'At least one image is required.';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (isViewMode) return; 

        if (validate()) {
            onSave(formData, imageFiles);
        } else {
            console.error('Please fill out all required fields correctly.'); 
        }
    };

    const handleTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const pageTitle = isAddMode ? 'Add New Destination' : 
                      isEditMode ? `Edit Destination: ID ${initialData.id}` : 
                      `View Destination: ID ${initialData.id}`;

    return (
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-6xl mx-auto my-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">{pageTitle}</h1>
                <div className='flex space-x-3'>
                    {isEditMode && onDelete && (
                        <button
                            type="button"
                            onClick={() => onDelete(formData.id!)} 
                            className="p-2 rounded-full text-red-600 hover:bg-red-100 transition-colors"
                            aria-label="Delete Destination"
                        >
                            <Trash2 className="w-6 h-6" />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors shadow-sm font-medium"
                    >
                        Exit
                    </button>
                    {!isViewMode && ( 
                        <button
                            type="submit"
                            onClick={handleSubmit} // Use onClick to trigger submit on the button itself
                            className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-md font-medium"
                        >
                            <Check className="w-4 h-4 mr-2" />
                            {isEditMode ? 'Done' : 'Add'}
                        </button>
                    )}
                </div>
            </div>
            <hr className="mb-8" /> {/* Separator for cleaner look */}

            <form onSubmit={handleSubmit} className="mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column (Main Fields) - Spans 2/3 */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Destination Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="name"
                                id="name"
                                value={formData.name}
                                onChange={handleChange}
                                disabled={isViewMode}
                                className={`w-full px-4 py-2 rounded-lg focus:ring-teal-500 focus:border-teal-500 ${isViewMode ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'border border-gray-300'} ${errors.name ? 'border-red-500' : ''}`}
                                placeholder="e.g., Iceland: Northern Lights & Glacier Hike"
                            />
                            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                        </div>

                        {/* Type */}
                        <div>
                            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Type <span className="text-red-500">*</span></label>
                            <Dropdown
                                name="type"
                                value={formData.type}
                                options={formTypeOptions}
                                onChange={(value) => handleChange({ target: { name: 'type', value, type: 'select' } } as ChangeEvent<HTMLSelectElement>)}
                                placeholder="Select Type"
                                disabled={isViewMode}
                                className={`w-full ${errors.type ? 'border-red-500 rounded-lg' : ''}`}
                            />
                            {errors.type && <p className="mt-1 text-xs text-red-500">{errors.type}</p>}
                        </div>

                        {/* Contact (Numeric Restriction) */}
                        <div>
                            <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1">Contact <span className="text-red-500">*</span></label>
                            <input
                                type="tel" // Use tel for mobile keyboard optimization
                                name="contact"
                                id="contact"
                                value={formData.contact}
                                onChange={handleChange}
                                disabled={isViewMode}
                                // Pattern is for basic client-side check, primary logic is in validation
                                pattern="[0-9+-\s()]*" 
                                className={`w-full px-4 py-2 rounded-lg focus:ring-teal-500 focus:border-teal-500 ${isViewMode ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'border border-gray-300'} ${errors.contact ? 'border-red-500' : ''}`}
                                placeholder="e.g., +6612345678 or 0812345678"
                            />
                            {errors.contact && <p className="mt-1 text-xs text-red-500">{errors.contact}</p>}
                        </div>
                        
                        {/* Country & City */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Country <span className="text-red-500">*</span></label>
                                <Dropdown
                                    name="country"
                                    value={formData.country}
                                    options={countryOptions}
                                    onChange={(value) => handleChange({ target: { name: 'country', value, type: 'select' } } as ChangeEvent<HTMLSelectElement>)}
                                    placeholder="Select Country"
                                    disabled={isViewMode}
                                    className={`w-full ${errors.country ? 'border-red-500 rounded-lg' : ''}`}
                                />
                                {errors.country && <p className="mt-1 text-xs text-red-500">{errors.country}</p>}
                            </div>
                            <div>
                                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
                                <Dropdown
                                    name="city"
                                    value={formData.city}
                                    options={cityOptions[formData.country] || []}
                                    onChange={(value) => handleChange({ target: { name: 'city', value, type: 'select' } } as ChangeEvent<HTMLSelectElement>)}
                                    placeholder="Select City"
                                    disabled={isViewMode || !formData.country}
                                    className={`w-full ${errors.city ? 'border-red-500 rounded-lg' : ''}`}
                                />
                                {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city}</p>}
                            </div>
                        </div>

                        {/* Latitude & Longitude */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">Latitude <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    name="latitude"
                                    id="latitude"
                                    value={formData.latitude ?? ''}
                                    onChange={handleChange}
                                    step="any"
                                    disabled={isViewMode}
                                    className={`w-full px-4 py-2 rounded-lg focus:ring-teal-500 focus:border-teal-500 ${isViewMode ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'border border-gray-300'} ${errors.latitude ? 'border-red-500' : ''}`}
                                    placeholder="e.g., 13.7563"
                                />
                                {errors.latitude && <p className="mt-1 text-xs text-red-500">{errors.latitude}</p>}
                            </div>
                            <div>
                                <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1">Longitude <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    name="longitude"
                                    id="longitude"
                                    value={formData.longitude ?? ''}
                                    onChange={handleChange}
                                    step="any"
                                    disabled={isViewMode}
                                    className={`w-full px-4 py-2 rounded-lg focus:ring-teal-500 focus:border-teal-500 ${isViewMode ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'border border-gray-300'} ${errors.longitude ? 'border-red-500' : ''}`}
                                    placeholder="e.g., 100.5018"
                                />
                                {errors.longitude && <p className="mt-1 text-xs text-red-500">{errors.longitude}</p>}
                            </div>
                        </div>

                        {/* Opening & Closing Time */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="openingTime" className="block text-sm font-medium text-gray-700 mb-1">Opening Time <span className="text-red-500">*</span></label>
                                <input
                                    type="time"
                                    name="openingTime"
                                    id="openingTime"
                                    value={formData.openingTime}
                                    onChange={handleTimeChange}
                                    disabled={isViewMode}
                                    className={`w-full px-4 py-2 rounded-lg focus:ring-teal-500 focus:border-teal-500 ${isViewMode ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'border border-gray-300'} ${errors.openingTime ? 'border-red-500' : ''}`}
                                />
                                {errors.openingTime && <p className="mt-1 text-xs text-red-500">{errors.openingTime}</p>}
                            </div>
                            <div>
                                <label htmlFor="closingTime" className="block text-sm font-medium text-gray-700 mb-1">Closing Time <span className="text-red-500">*</span></label>
                                <input
                                    type="time"
                                    name="closingTime"
                                    id="closingTime"
                                    value={formData.closingTime}
                                    onChange={handleTimeChange}
                                    disabled={isViewMode}
                                    className={`w-full px-4 py-2 rounded-lg focus:ring-teal-500 focus:border-teal-500 ${isViewMode ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'border border-gray-300'} ${errors.closingTime ? 'border-red-500' : ''}`}
                                />
                                {errors.closingTime && <p className="mt-1 text-xs text-red-500">{errors.closingTime}</p>}
                            </div>
                        </div>

                        {/* Description - Takes full width in this column */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
                            <textarea
                                name="description"
                                id="description"
                                rows={6} // Increased rows for better description area
                                value={formData.description}
                                onChange={handleChange}
                                disabled={isViewMode}
                                className={`w-full px-4 py-2 rounded-lg focus:ring-teal-500 focus:border-teal-500 resize-none ${isViewMode ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'border border-gray-300'} ${errors.description ? 'border-red-500' : ''}`}
                                placeholder="Detailed description of the destination and activities..."
                            />
                            {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
                        </div>

                    </div>

                    {/* Right Column (Image Uploader) - Spans 1/3 */}
                    <ImageUploader 
                        initialImages={formData.images} 
                        onImagesChange={handleImagesChange} 
                        disabled={isViewMode} 
                        viewMode={viewMode} // <<-- [แก้ไขที่ 3] ส่ง viewMode จาก Form ไปยัง Uploader
                    />
                </div>
                {errors.images && <p className="mt-4 text-xs text-red-500 text-center">{errors.images}</p>}

                {/* NOTE: Action buttons are moved to the top right section now */}
            </form>
        </div>
    );
};
// #endregion DestinationForm Component


// #region StatusPill & ActionMenu Components
interface StatusPillProps {
    status: 'Active' | 'Inactive';
}
const StatusPill: React.FC<StatusPillProps> = ({ status }) => {
    const baseClasses = 'inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium';
    const classes = status === 'Active'
        ? 'bg-green-100 text-green-800'
        : 'bg-red-100 text-red-800';

    return (
        <span className={`${baseClasses} ${classes}`}>
            {status}
        </span>
    );
};

interface ActionOption {
    value: string;
    label: string;
    action: () => void;
}
interface ActionMenuProps {
    options: ActionOption[];
    isOpen: boolean; // <<-- [แก้ไขที่ 4] เพิ่ม isOpen
    onToggle: () => void; // <<-- [แก้ไขที่ 5] เพิ่ม onToggle
    onClose: () => void; // <<-- [แก้ไขที่ 6] เพิ่ม onClose
}
const ActionMenu: React.FC<ActionMenuProps> = ({ options, isOpen, onToggle, onClose }) => { // <<-- [แก้ไขที่ 7] รับ Props ใหม่
    const menuRef = useRef<HTMLDivElement>(null); // <<-- [แก้ไขที่ 8] เพิ่ม Ref

    // [แก้ไขที่ 9] useEffect สำหรับ Click Outside
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

    const positionClasses = 'absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-gray-200 focus:outline-none z-10';

    const handleAction = (action: () => void) => {
        action();
        onClose(); // <<-- [แก้ไขที่ 10] ใช้ onClose แทน setIsOpen(false)
    };

  return (
        <div className="relative inline-block text-left" ref={menuRef}> {/* <<-- [แก้ไขที่ 11] เพิ่ม Ref */}
            <div>
                <button
                    type="button"
                    className="inline-flex justify-center items-center rounded-full bg-white p-1 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none transition-colors"
                    onClick={onToggle} // <<-- [แก้ไขที่ 12] ใช้ onToggle
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                >
                    <MoreVertical className="h-5 w-5" />
                </button>
            </div>

         {isOpen && ( // <<-- [แก้ไขที่ 13] ใช้ isOpen
                <div
                    className={positionClasses}
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="menu-button"
                    tabIndex={-1}
                    // onBlur ถูกลบออก
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
// #endregion StatusPill & ActionMenu Components

// #region Mock Data & Logic
export interface Destination {
    id: number;
    status: 'Active' | 'Inactive';
    name: string;
    type: string;
    createdBy: string;
    adminName: string;
}

export const destinationData: Destination[] = [
    { id: 1, status: 'Active', name: 'France: Hands-On Cooking Class with Pâtisserie Chef Noémie', type: 'Food', createdBy: 'S123456', adminName: 'Liora Nyen' },
    { id: 5, status: 'Active', name: 'Iceland: Northern Lights & Glacier Hike', type: 'Nature', createdBy: 'S123459', adminName: 'John Doe' },
    { id: 3, status: 'Active', name: 'New York: Central Park Photography Workshop', type: 'Sightseeing', createdBy: 'S123457', adminName: 'Alex Chen' },
    { id: 4, status: 'Inactive', name: 'Rome: Authentic Pasta Making', type: 'Food', createdBy: 'S123458', adminName: 'Sarah Bell' },
    { id: 2, status: 'Inactive', name: 'Tokyo: Senso-ji Temple Tour and Matcha Tasting', type: 'Culture', createdBy: 'S123456', adminName: 'Liora Nyen' },
    { id: 6, status: 'Active', name: 'Thailand: Floating Market Culinary Tour', type: 'Food', createdBy: 'S123460', adminName: 'Pim Kanda' },
];

// ** Updated Type Options **
export const typeOptions = [
    { value: 'Culture', label: 'Culture' },
    { value: 'Food', label: 'Food' },
    { value: 'Nature', label: 'Nature' },
    { value: 'Sport', label: 'Sport' },
    { value: 'Sightseeing', label: 'Sightseeing' }, // Kept Sightseeing for existing mock data
];

export const sortOptions = [
    { value: 'id_low', label: 'ID (Low to High)' },
    { value: 'id_high', label: 'ID (High to Low)' },
    { value: 'name_asc', label: 'Name (A-Z)' },
    { value: 'name_desc', label: 'Name (Z-A)' },
];

const processDestinations = (data: Destination[], searchTerm: string, sortBy: string, filterType: string, filterStatus: string): Destination[] => {
    let result = [...data];

    // 1. Filter by Search Term
    if (searchTerm) {
        result = result.filter(dest =>
            dest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            dest.id.toString().includes(searchTerm)
        );
    }

    // 2. Filter by Type
    if (filterType) {
        result = result.filter(dest => dest.type === filterType);
    }

    // 3. Filter by Status
    if (filterStatus) {
        result = result.filter(dest => dest.status === filterStatus);
    }

    // 4. Sort
    result.sort((a, b) => {
        switch (sortBy) {
            case 'name_asc': return a.name.localeCompare(b.name);
            case 'name_desc': return b.name.localeCompare(a.name);
            case 'id_low': return a.id - b.id;
            case 'id_high': return b.id - a.id;
            default: return 0;
        }
    });

    return result;
};
// #endregion Mock Data & Logic


const DestinationManagement: React.FC = () => {
   const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit' | 'view'>('list'); 
    const [formDataForForm, setFormDataForForm] = useState<DestinationFormData | null>(null); // Data passed to DestinationForm
    const [isConfirmVisible, setIsConfirmVisible] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; handler: () => void; confirmText?: string; cancelText?: string; confirmButtonClass?: string } | null>(null);
    const [isSortOpen, setIsSortOpen] = useState(false); 
    const [isFilterOpen, setIsFilterOpen] = useState(false); 
    const [isOpenActionMenuId, setIsOpenActionMenuId] = useState<number | null>(null); // <<-- [แก้ไขที่ 14] State สำหรับ Action Menu

    const sortRef = useRef<HTMLDivElement>(null); // <<-- [แก้ไขที่ 15] Ref สำหรับ Sort
    const filterRef = useRef<HTMLDivElement>(null); // <<-- [แก้ไขที่ 16] Ref สำหรับ Filter

    const handleSearch = () => {
        console.log(`Search button clicked for: ${searchTerm}`);
    };

// [แก้ไขที่ 17] useEffect สำหรับ Click Outside (Sort/Filter)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
                setIsSortOpen(false);
            }
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []); 

    // [แก้ไขที่ 18] ฟังก์ชันจัดการการเปิด-ปิด Sort/Filter เพื่อให้เปิดได้ทีละอัน
    const handleToggleSort = () => {
        setIsFilterOpen(false); 
        setIsOpenActionMenuId(null); // ปิด Action Menu อื่นๆ
        setIsSortOpen(prev => !prev);
    };

    const handleToggleFilter = () => {
        setIsSortOpen(false); // ปิด Sort
        setIsOpenActionMenuId(null); // ปิด Action Menu อื่นๆ
        setIsFilterOpen(prev => !prev);
    };

    // [แก้ไขที่ 19] ฟังก์ชันจัดการการเปิด-ปิด Action Menu
    const handleToggleActionMenu = (id: number) => {
        setIsSortOpen(false); // ปิด Sort
        setIsFilterOpen(false); // ปิด Filter
        setIsOpenActionMenuId(prevId => prevId === id ? null : id); // Toggle หรือเปิดใหม่
    };

    const handleCloseActionMenu = () => {
        setIsOpenActionMenuId(null);
    };

    const filteredAndSortedData = useMemo(() => {
        return processDestinations(destinationData, searchTerm, sortBy, filterType, filterStatus);
    }, [searchTerm, sortBy, filterType, filterStatus]);


    const handleViewDetail = (id: number) => {
        // Find existing data or use mock
        const existingData = destinationData.find(d => d.id === id);
        if (existingData) {
            // For view mode, we need full data. Using mock for now.
            setFormDataForForm({
                ...mockViewDestinationData, // Use a comprehensive mock for view
                id: existingData.id,
                name: existingData.name,
                type: existingData.type,
                // Assume other fields are filled by a backend lookup
            });
            setViewMode('view');
        } else {
            console.error(`Destination with ID ${id} not found for view.`);
        }
    };

    const handleEditDetail = (id: number) => {
        // Use mockEditDestinationData if ID matches, otherwise create generic mock
        if (id === 1) {
            setFormDataForForm(mockEditDestinationData); 
        } else {
            setFormDataForForm({
                ...emptyDestinationInitialData,
                id: id,
                name: `Destination ID: ${id} (Mock Edit Data)`,
                description: 'Description for mock edit.',
                contact: '0812345678',
                country: 'Thailand',
                city: 'Bangkok',
                latitude: 13.75,
                longitude: 100.5,
                openingTime: '08:00',
                closingTime: '17:00',
                type: 'Sightseeing',
                images: ['https://via.placeholder.com/150/FF5733/FFFFFF?text=MockEdit'],
            });
        }
        setViewMode('edit'); 
    };

    const handleDeleteDestination = (id: number) => {
        setConfirmAction({
            title: 'Confirm Delete Destination',
            message: `Are you sure you want to delete Destination ID: ${id}? This action cannot be undone.`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            confirmButtonClass: 'bg-red-600 hover:bg-red-700',
            handler: () => {
                console.log(`Deleting Destination ID: ${id}`);
                // In a real app, you would make an API call here.
                // After successful deletion:
                setConfirmAction({
                    title: 'Deletion Successful!',
                    message: `Destination ID: ${id} has been successfully deleted.`,
                    confirmText: 'OK',
                    confirmButtonClass: 'bg-teal-600 hover:bg-teal-700',
                    handler: () => {
                        setIsConfirmVisible(false);
                        setConfirmAction(null);
                        setViewMode('list'); 
                        setFormDataForForm(null);
                        // Optionally refresh destinationData to remove the deleted item
                    }
                });
            }
        });
        setIsConfirmVisible(true);
    };


    const handleSaveForm = (data: DestinationFormData, imageFiles: File[]) => {
        setConfirmAction({
            title: viewMode === 'add' ? 'Confirm Add New Destination' : 'Confirm Save Changes',
            message: viewMode === 'add' ? 'Are you sure you want to add this destination? Please ensure all details are correct.' : `Are you sure you want to save changes to ID ${data.id}?`,
            confirmText: viewMode === 'add' ? 'Add Destination' : 'Save Changes',
            confirmButtonClass: 'bg-green-500 hover:bg-green-600',
            handler: () => {
                console.log(`${viewMode === 'add' ? 'Added' : 'Saved changes to'} Destination: ${data.name}`, data);
                console.log('Image Files to upload:', imageFiles);
                
                setConfirmAction({
                    title: 'Success!',
                    message: `${data.name} has been successfully ${viewMode === 'add' ? 'added' : 'updated'}.`,
                    confirmText: 'OK',
                    confirmButtonClass: 'bg-teal-600 hover:bg-teal-700',
                    handler: () => {
                        setIsConfirmVisible(false);
                        setConfirmAction(null);
                        setViewMode('list'); 
                        setFormDataForForm(null);
                    }
                });
            }
        });
        setIsConfirmVisible(true);
    };

    const handleCancelForm = () => {
        setViewMode('list');
        setFormDataForForm(null);
    };

    const handleConfirmClose = () => {
        if (confirmAction && confirmAction.confirmText === 'OK') {
            confirmAction.handler(); // Execute the success handler
        } else {
            setIsConfirmVisible(false);
            setConfirmAction(null);
        }
    };
    
    // Handler for delete button on the form (which triggers the popup)
    const handleFormDelete = (id: number) => {
        handleDeleteDestination(id);
    }
    
    // Render list view
   if (viewMode === 'list') {
        return (
            <div className="p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Destination Management</h1>
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                    <SearchBar 
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        onSearch={handleSearch}
                    />
                   <div className="flex space-x-3">
                        {/* Sort Dropdown */}
                        <div className="relative" ref={sortRef}> {/* <<-- [แก้ไขที่ 20] เพิ่ม ref */}
                            <button
                                onClick={handleToggleSort} // <<-- [แก้ไขที่ 21] ใช้ฟังก์ชันใหม่
                                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm text-sm"
                            >
                                <ArrowDownWideNarrow className="w-4 h-4 mr-2" />
                                Sort By
                                <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isSortOpen ? 'rotate-180' : 'rotate-0'}`} />
                            </button>
                           {isSortOpen && (
                                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-xl bg-white ring-1 ring-gray-200 z-10 p-2">
                                    {sortOptions.map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => { setSortBy(option.value); setIsSortOpen(false); }}
                                            className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${sortBy === option.value ? 'bg-indigo-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                      {/* Filter Dropdown */}
                        <div className="relative" ref={filterRef}> {/* <<-- [แก้ไขที่ 22] เพิ่ม ref */}
                            <button
                                onClick={handleToggleFilter} // <<-- [แก้ไขที่ 23] ใช้ฟังก์ชันใหม่
                                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm text-sm"
                            >
                                <SlidersHorizontal className="w-4 h-4 mr-2" />
                                Filter
                                <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isFilterOpen ? 'rotate-180' : 'rotate-0'}`} />
                            </button>
                            {isFilterOpen && (
                                <div className="absolute right-0 mt-2 w-64 rounded-md shadow-xl bg-white ring-1 ring-gray-200 z-10 p-4 space-y-3">
                                    <div className='border-b pb-3'>
                                        <p className='text-xs font-semibold text-gray-500 mb-1'>Filter by Type</p>
                                        <Dropdown
                                            name="filterType"
                                            value={filterType}
                                            options={typeOptions}
                                            onChange={setFilterType}
                                            placeholder="All Types"
                                            className="w-full"
                                        />
                                    </div>
                                    <div className=''>
                                        <p className='text-xs font-semibold text-gray-500 mb-1'>Filter by Status</p>
                                        <Dropdown
                                            name="filterStatus"
                                            value={filterStatus}
                                            options={[
                                                { value: 'Active', label: 'Active' },
                                                { value: 'Inactive', label: 'Inactive' }
                                            ]}
                                            onChange={setFilterStatus}
                                            placeholder="All Statuses"
                                            className="w-full"
                                        />
                                    </div>
                                    
                                    <div className="flex justify-end pt-2">
                                        <button 
                                            onClick={() => {setFilterType(''); setFilterStatus(''); setIsFilterOpen(false);}}
                                            className="text-sm text-red-500 hover:text-red-700 transition-colors"
                                        >
                                            Clear Filters
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={() => { 
                                setFormDataForForm(emptyDestinationInitialData);
                                setViewMode('add'); 
                                setIsSortOpen(false); // [เพิ่ม] ปิด Sort
                                setIsFilterOpen(false); // [เพิ่ม] ปิด Filter
                                setIsOpenActionMenuId(null); // [เพิ่ม] ปิด Action Menu
                            }}
                            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md text-sm font-medium"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add New
                        </button>
                    </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-lg overflow-hidden mt-6">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DESTINATION ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DESTINATION NAME</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TYPE</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CREATED BY</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ADMIN NAME</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ACTIONS</th>
                            </tr>
                        </thead>
                       <tbody className="bg-white divide-y divide-gray-200">
                            {filteredAndSortedData.length > 0 ? (
                                filteredAndSortedData.map((destination) => (
                                    <tr key={destination.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusPill status={destination.status} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{destination.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{destination.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{destination.type}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{destination.createdBy}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{destination.adminName}</td>
                                       <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <ActionMenu
                                                options={[
                                                    { value: 'view', label: 'View Detail', action: () => handleViewDetail(destination.id) },
                                                    { value: 'edit', label: 'Edit Detail', action: () => handleEditDetail(destination.id) },
                                                ]}
                                                isOpen={isOpenActionMenuId === destination.id} // <<-- [แก้ไขที่ 24]
                                                onToggle={() => handleToggleActionMenu(destination.id)} // <<-- [แก้ไขที่ 25]
                                                onClose={handleCloseActionMenu} // <<-- [แก้ไขที่ 26]
                                            />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500 text-lg">
                                        No destinations found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
    
    // Render form view
    const initialFormState = formDataForForm || emptyDestinationInitialData;

    return (
        <>
            <DestinationForm
                initialData={initialFormState}
                viewMode={viewMode as 'add' | 'edit' | 'view'}
                onSave={handleSaveForm}
                onCancel={handleCancelForm}
                onDelete={handleFormDelete} 
            />
            <ConfirmPopup
                isVisible={isConfirmVisible}
                title={confirmAction?.title || 'Confirm'}
                message={confirmAction?.message || 'Are you sure?'}
                onConfirm={() => {
                    if (confirmAction?.confirmText === 'OK') {
                        handleConfirmClose();
                    } else if (confirmAction?.handler) {
                        confirmAction.handler();
                    }
                }}
                onCancel={handleConfirmClose} 
                confirmText={confirmAction?.confirmText}
                cancelText={confirmAction?.cancelText}
                confirmButtonClass={confirmAction?.confirmButtonClass}
            />
        </>
    );
};

export default DestinationManagement;