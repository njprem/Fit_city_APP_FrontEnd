import React, { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Trash2, Check } from 'lucide-react';

import Dropdown from './Dropdown';
import type { DropdownOption } from './Dropdown';
import ImageUploader from './ImageUploader';
import type { DestinationFormData } from './destinationFormData';

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
    const numericFormId = typeof formData.id === 'number' ? formData.id : null;

    // Update formData and imageFiles when initialData or viewMode changes
    useEffect(() => {
        setFormData(initialData);
        setImageFiles(initialData.imageFiles || []);
        setErrors({}); // Clear errors on mode/data change
    }, [initialData, viewMode]);

    const isViewMode = viewMode === 'view';
    const isEditMode = viewMode === 'edit';
    const isAddMode = viewMode === 'add';

    const applyFieldChange = (name: keyof DestinationFormData, rawValue: string | number | null) => {
        const finalValue =
            rawValue === null && (name === 'latitude' || name === 'longitude')
                ? null
                : rawValue;

        setFormData(prev => ({
            ...prev,
            [name]: finalValue as DestinationFormData[keyof DestinationFormData],
        }));

        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[name as string];
            return newErrors;
        });
    };

    const formTypeOptions = [
        { value: 'Culture', label: 'Culture' },
        { value: 'Food', label: 'Food' },
        { value: 'Nature', label: 'Nature' },
        { value: 'Sport', label: 'Sport' },
    ];
    
    // Mock country/city options
    const countryOptions: DropdownOption[] = [
        { value: 'Japan', label: 'Japan' },
        { value: 'France', label: 'France' },
        { value: 'Thailand', label: 'Thailand' },
        { value: 'USA', label: 'USA' },
    ];

    const cityOptions: Record<string, DropdownOption[]> = {
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
            processedValue = value;
        }

        applyFieldChange(name as keyof DestinationFormData, processedValue);
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
                    {isEditMode && onDelete && numericFormId !== null && (
                        <button
                            type="button"
                            onClick={() => onDelete(numericFormId)} 
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
                                onChange={(value) => applyFieldChange('type', value)}
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
                                    onChange={(value) => {
                                        applyFieldChange('country', value);
                                        if (formData.city) {
                                            applyFieldChange('city', '');
                                        }
                                    }}
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
                                    onChange={(value) => applyFieldChange('city', value)}
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

export default DestinationForm;
