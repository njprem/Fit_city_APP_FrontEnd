import React, { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Trash2, Check } from 'lucide-react';

import Dropdown from './Dropdown';
import type { DropdownOption } from './Dropdown';
import ImageUploader from './ImageUploader';
import type { DestinationFormData } from './destinationFormData';

interface DestinationFormProps {
    data: DestinationFormData; // fully controlled by parent
    viewMode: 'add' | 'edit' | 'view'; 
    onChange: (data: DestinationFormData) => void;
    onSave: (data: DestinationFormData, imageFiles: File[]) => void;
    onCancel: () => void;
    onDelete?: (id: number | string) => void; 
    isLoading?: boolean; // disable inputs while detail is being fetched
    externalErrors?: Record<string, string>;
    hideExitButton?: boolean;
}

const DestinationForm: React.FC<DestinationFormProps> = ({ data, viewMode, onChange, onSave, onCancel, onDelete, isLoading = false, externalErrors = {}, hideExitButton = false }) => {
    const [imageFiles, setImageFiles] = useState<File[]>(data.imageFiles || []);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const hasFormId = data.id !== null && data.id !== undefined && data.id !== '';

    useEffect(() => {
        setImageFiles(data.imageFiles || []);
        setErrors({});
    }, [data, viewMode]);

    const isViewMode = viewMode === 'view';
    const isEditMode = viewMode === 'edit';
    const isAddMode = viewMode === 'add';
    const isLocked = isViewMode || isLoading;

    const mergedErrors = { ...errors, ...externalErrors };

    const updateField = (name: keyof DestinationFormData, value: DestinationFormData[keyof DestinationFormData]) => {
        const next = { ...data, [name]: value };
        onChange(next);
        setErrors(prev => {
            const copy = { ...prev };
            delete copy[name as string];
            return copy;
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

        updateField(name as keyof DestinationFormData, processedValue as DestinationFormData[keyof DestinationFormData]);
    };

    const handleImagesChange = (files: File[]) => {
        setImageFiles(files);
        updateField('imageFiles', files as unknown as DestinationFormData[keyof DestinationFormData]);
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!data.name) newErrors.name = 'Destination Name is required.';
        if (!data.type) newErrors.type = 'Type is required.'; 
        
        const sanitizedContact = data.contact.replace(/[^\d+]/g, ''); // Remove all non-digits except '+'
        if (!data.contact || sanitizedContact.length < 5) newErrors.contact = 'Valid Contact number is required (min 5 characters).';
        
        if (!data.country) newErrors.country = 'Country is required.';
        if (!data.city) newErrors.city = 'City is required.';
        if (data.latitude === null || isNaN(data.latitude)) newErrors.latitude = 'Valid Latitude is required.';
        if (data.longitude === null || isNaN(data.longitude)) newErrors.longitude = 'Valid Longitude is required.';
        if (!data.openingTime) newErrors.openingTime = 'Opening Time is required.';
        if (!data.closingTime) newErrors.closingTime = 'Closing Time is required.';
        if (!data.description) newErrors.description = 'Description is required.';
        if (isAddMode && imageFiles.length === 0 && data.images.length === 0) newErrors.images = 'At least one image is required.';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (isViewMode) return; 

        if (validate()) {
            onSave(data, imageFiles);
        } else {
            console.error('Please fill out all required fields correctly.'); 
        }
    };

    const handleTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        updateField(name as keyof DestinationFormData, value as DestinationFormData[keyof DestinationFormData]);
    };

    const pageTitle = isAddMode ? 'Add New Destination' : 
                      isEditMode ? `Edit Destination: ID ${data.id}` : 
                      `View Destination: ID ${data.id}`;

    return (
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-6xl mx-auto my-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">{pageTitle}</h1>
                <div className='flex space-x-3'>
                    {isEditMode && onDelete && hasFormId && (
                        <button
                            type="button"
                            onClick={() => onDelete(data.id as number | string)} 
                            className="p-2 rounded-full text-red-600 hover:bg-red-100 transition-colors"
                            aria-label="Delete Destination"
                        >
                            <Trash2 className="w-6 h-6" />
                        </button>
                    )}
                    {!hideExitButton && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors shadow-sm font-medium"
                        >
                            Exit
                        </button>
                    )}
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
                <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 ${isLoading ? 'opacity-60 pointer-events-none' : ''}`}>
                    {/* Left Column (Main Fields) - Spans 2/3 */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Destination Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="name"
                                id="name"
                                value={data.name}
                                onChange={handleChange}
                                disabled={isLocked}
                                className={`w-full px-4 py-2 rounded-lg focus:ring-teal-500 focus:border-teal-500 ${isLocked ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'border border-gray-300'} ${mergedErrors.name ? 'border-red-500' : ''}`}
                                placeholder="e.g., Iceland: Northern Lights & Glacier Hike"
                            />
                            {mergedErrors.name && <p className="mt-1 text-xs text-red-500">{mergedErrors.name}</p>}
                        </div>

                        {/* Type */}
                        <div>
                            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Type <span className="text-red-500">*</span></label>
                            <Dropdown
                                name="type"
                                value={data.type}
                                options={formTypeOptions}
                                onChange={(value) => updateField('type', value as DestinationFormData[keyof DestinationFormData])}
                                placeholder="Select Type"
                                disabled={isLocked}
                                className={`w-full ${mergedErrors.type ? 'border-red-500 rounded-lg' : ''}`}
                            />
                            {mergedErrors.type && <p className="mt-1 text-xs text-red-500">{mergedErrors.type}</p>}
                        </div>

                        {/* Contact (Numeric Restriction) */}
                        <div>
                            <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1">Contact <span className="text-red-500">*</span></label>
                            <input
                                type="tel" // Use tel for mobile keyboard optimization
                                name="contact"
                                id="contact"
                                value={data.contact}
                                onChange={handleChange}
                                disabled={isLocked}
                                // Pattern is for basic client-side check, primary logic is in validation
                                pattern="[0-9+-\s()]*" 
                                className={`w-full px-4 py-2 rounded-lg focus:ring-teal-500 focus:border-teal-500 ${isLocked ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'border border-gray-300'} ${mergedErrors.contact ? 'border-red-500' : ''}`}
                                placeholder="e.g., +6612345678 or 0812345678"
                            />
                            {mergedErrors.contact && <p className="mt-1 text-xs text-red-500">{mergedErrors.contact}</p>}
                        </div>
                        
                        {/* Country & City */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Country <span className="text-red-500">*</span></label>
                                <Dropdown
                                    name="country"
                                    value={data.country}
                                    options={countryOptions}
                                    onChange={(value) => {
                                        updateField('country', value as DestinationFormData[keyof DestinationFormData]);
                                        if (data.city) {
                                            updateField('city', '' as DestinationFormData[keyof DestinationFormData]);
                                        }
                                    }}
                                    placeholder="Select Country"
                                    disabled={isLocked}
                                className={`w-full ${mergedErrors.country ? 'border-red-500 rounded-lg' : ''}`}
                                />
                                {mergedErrors.country && <p className="mt-1 text-xs text-red-500">{mergedErrors.country}</p>}
                            </div>
                            <div>
                                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
                                <Dropdown
                                    name="city"
                                    value={data.city}
                                    options={cityOptions[data.country] || []}
                                    onChange={(value) => updateField('city', value as DestinationFormData[keyof DestinationFormData])}
                                    placeholder="Select City"
                                    disabled={isLocked || !data.country}
                                className={`w-full ${mergedErrors.city ? 'border-red-500 rounded-lg' : ''}`}
                                />
                                {mergedErrors.city && <p className="mt-1 text-xs text-red-500">{mergedErrors.city}</p>}
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
                                    value={data.latitude ?? ''}
                                    onChange={handleChange}
                                    step="any"
                                    disabled={isLocked}
                                    className={`w-full px-4 py-2 rounded-lg focus:ring-teal-500 focus:border-teal-500 ${isLocked ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'border border-gray-300'} ${mergedErrors.latitude ? 'border-red-500' : ''}`}
                                    placeholder="e.g., 13.7563"
                                />
                                {mergedErrors.latitude && <p className="mt-1 text-xs text-red-500">{mergedErrors.latitude}</p>}
                            </div>
                            <div>
                                <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1">Longitude <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    name="longitude"
                                    id="longitude"
                                    value={data.longitude ?? ''}
                                    onChange={handleChange}
                                    step="any"
                                    disabled={isLocked}
                                    className={`w-full px-4 py-2 rounded-lg focus:ring-teal-500 focus:border-teal-500 ${isLocked ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'border border-gray-300'} ${mergedErrors.longitude ? 'border-red-500' : ''}`}
                                    placeholder="e.g., 100.5018"
                                />
                                {mergedErrors.longitude && <p className="mt-1 text-xs text-red-500">{mergedErrors.longitude}</p>}
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
                                    value={data.openingTime}
                                    onChange={handleTimeChange}
                                    disabled={isLocked}
                                className={`w-full px-4 py-2 rounded-lg focus:ring-teal-500 focus:border-teal-500 ${isLocked ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'border border-gray-300'} ${mergedErrors.openingTime ? 'border-red-500' : ''}`}
                                />
                                {mergedErrors.openingTime && <p className="mt-1 text-xs text-red-500">{mergedErrors.openingTime}</p>}
                            </div>
                            <div>
                                <label htmlFor="closingTime" className="block text-sm font-medium text-gray-700 mb-1">Closing Time <span className="text-red-500">*</span></label>
                                <input
                                    type="time"
                                    name="closingTime"
                                    id="closingTime"
                                    value={data.closingTime}
                                    onChange={handleTimeChange}
                                    disabled={isLocked}
                                className={`w-full px-4 py-2 rounded-lg focus:ring-teal-500 focus:border-teal-500 ${isLocked ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'border border-gray-300'} ${mergedErrors.closingTime ? 'border-red-500' : ''}`}
                                />
                                {mergedErrors.closingTime && <p className="mt-1 text-xs text-red-500">{mergedErrors.closingTime}</p>}
                            </div>
                        </div>

                        {/* Description - Takes full width in this column */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
                            <textarea
                                name="description"
                                id="description"
                                rows={6} // Increased rows for better description area
                                value={data.description}
                                onChange={handleChange}
                                disabled={isLocked}
                                className={`w-full px-4 py-2 rounded-lg focus:ring-teal-500 focus:border-teal-500 resize-none ${isLocked ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'border border-gray-300'} ${mergedErrors.description ? 'border-red-500' : ''}`}
                                placeholder="Detailed description of the destination and activities..."
                            />
                            {mergedErrors.description && <p className="mt-1 text-xs text-red-500">{mergedErrors.description}</p>}
                        </div>

                    </div>

                    {/* Right Column (Image Uploader) - Spans 1/3 */}
                    <ImageUploader 
                        initialImages={data.images} 
                        onImagesChange={handleImagesChange} 
                        disabled={isLocked} 
                        viewMode={viewMode} // <<-- [แก้ไขที่ 3] ส่ง viewMode จาก Form ไปยัง Uploader
                    />
                </div>
                {mergedErrors.images && <p className="mt-4 text-xs text-red-500 text-center">{mergedErrors.images}</p>}

                {/* NOTE: Action buttons are moved to the top right section now */}
            </form>
        </div>
    );
};

export default DestinationForm;
