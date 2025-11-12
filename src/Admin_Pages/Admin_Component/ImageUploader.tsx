import React, { useState, useRef, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { Camera, X } from 'lucide-react';

export interface ImageUploaderProps {
    initialImages: string[];
    onImagesChange: (files: File[]) => void;
    maxImages?: number;
    disabled?: boolean;
    viewMode: 'list' | 'add' | 'edit' | 'view';
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ initialImages, onImagesChange, maxImages = 3, disabled = false, viewMode }) => {
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (initialImages && initialImages.length > 0) {
            setImagePreviews(initialImages);
            setImageFiles([]);
        } else {
            setImagePreviews([]);
            setImageFiles([]);
        }
    }, [initialImages]);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (disabled) return;

        const files = Array.from(event.target.files || []);
        const currentFileCount = imageFiles.length;
        const remainingSlots = maxImages - currentFileCount;
        const newFiles = files.slice(0, remainingSlots);
        const updatedImageFiles = [...imageFiles, ...newFiles];

        const newFilePreviews = newFiles.map((file) => URL.createObjectURL(file));
        const updatedImagePreviews = [...initialImages, ...newFilePreviews];

        setImageFiles(updatedImageFiles);
        setImagePreviews(updatedImagePreviews);
        onImagesChange(updatedImageFiles);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveImage = (indexToRemove: number) => {
        if (disabled) return;

        const isInitialImage = indexToRemove < initialImages.length;

        if (isInitialImage) {
            const newInitialImages = initialImages.filter((_, index) => index !== indexToRemove);
            const newFilePreviews = imageFiles.map((file) => URL.createObjectURL(file));
            setImagePreviews([...newInitialImages, ...newFilePreviews]);
            console.log(`Initial image at index ${indexToRemove} removed from preview. Parent component should handle backend deletion.`);
        } else {
            const fileIndex = indexToRemove - initialImages.length;
            const updatedFiles = imageFiles.filter((_, index) => index !== fileIndex);
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

    const finalPreviews = [...initialImages, ...imageFiles.map((file) => URL.createObjectURL(file))];

    return (
        <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Images (Max {maxImages})</label>
            <div className="flex flex-col items-center justify-center p-4 border border-gray-300 rounded-lg bg-gray-50 h-full">
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
                        onClick={triggerFileInput}
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
            {finalPreviews.length === 0 && (viewMode === 'add' || viewMode === 'edit') && (
                <p className="mt-1 text-xs text-red-500">At least one image is required.</p>
            )}
        </div>
    );
};

export default ImageUploader;
