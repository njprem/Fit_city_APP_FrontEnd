import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, ChevronDown, ArrowDownWideNarrow, SlidersHorizontal } from 'lucide-react'; 

import SearchBar from '../Admin_Component/SearchBar';
import Dropdown from '../Admin_Component/Dropdown';
import ConfirmPopup from '../Admin_Component/Confirm_Popup';
import DestinationForm, { emptyDestinationInitialData, mockEditDestinationData, mockViewDestinationData, type DestinationFormData } from '../Admin_Component/Destination_Form';
import StatusPill from '../Admin_Component/StatusPill';
import ActionMenu from '../Admin_Component/ActionMenu';








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
