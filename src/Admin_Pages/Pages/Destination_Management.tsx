import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, ChevronDown, ArrowDownWideNarrow, SlidersHorizontal } from 'lucide-react'; 

import SearchBar from '../Admin_Component/SearchBar';
import Dropdown from '../Admin_Component/Dropdown';
import ConfirmPopup from '../Admin_Component/Confirm_Popup';
import DestinationForm from '../Admin_Component/Destination_Form';
import { emptyDestinationInitialData, mockEditDestinationData, mockViewDestinationData, type DestinationFormData } from '../Admin_Component/destinationFormData';
import StatusPill, { type StatusType } from '../Admin_Component/StatusPill';
import ActionMenu from '../Admin_Component/ActionMenu';
import { fetchDestinationChanges, submitDestinationChange, type DestinationChange } from '../../api';

interface DestinationManagementProps {
    onNavigateToRequests?: () => void;
}


// #region Mock Data & Logic
interface Destination {
    id: number | string;
    status: StatusType;
    name: string;
    type: string;
    createdBy: string;
    adminName: string;
    changeRequestId?: string;
}

// ** Updated Type Options **
const typeOptions = [
    { value: 'Culture', label: 'Culture' },
    { value: 'Food', label: 'Food' },
    { value: 'Nature', label: 'Nature' },
    { value: 'Sport', label: 'Sport' },
];

const sortOptions = [
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
            case 'id_low': return String(a.id).localeCompare(String(b.id), undefined, { numeric: true, sensitivity: 'base' });
            case 'id_high': return String(b.id).localeCompare(String(a.id), undefined, { numeric: true, sensitivity: 'base' });
            default: return 0;
        }
    });

    return result;
};

const deriveStatusFromChange = (change: DestinationChange): StatusType => {
    const fieldStatus = typeof change.fields?.status === 'string' ? change.fields.status.toLowerCase() : '';
    if (change.action === 'delete' || change.fields?.hard_delete || fieldStatus === 'inactive') {
        return 'Inactive';
    }
    return 'Active';
};

const mapDraftStatus = (change: DestinationChange): StatusType => {
    const changeStatus = (change.status ?? '').toLowerCase();
    if (changeStatus === 'rejected') {
        return 'Reject';
    }
    const action = (change.action ?? '').toLowerCase();
    switch (action) {
        case 'create':
            return 'Add';
        case 'delete':
            return 'Delete';
        case 'update':
        case 'edit':
            return 'Edit';
        default:
            return 'Edit';
    }
};

const adaptApprovedChangeToDestination = (change: DestinationChange): Destination => {
    const fields = change.fields ?? {};
    const name =
        typeof fields.name === 'string' && fields.name.trim()
            ? fields.name
            : `Destination ${change.destination_id ?? change.id}`;
    const typeLabel =
        typeof fields.category === 'string' && fields.category.trim() ? fields.category : 'Unknown';

    return {
        id: change.destination_id ?? change.id,
        changeRequestId: change.id,
        status: deriveStatusFromChange(change),
        name,
        type: typeLabel,
        createdBy: change.submitted_by ?? 'Unknown',
        adminName: change.reviewed_by ?? '—',
    };
};

const adaptDraftChangeToDestination = (change: DestinationChange): Destination => {
    const fields = change.fields ?? {};
    const name =
        typeof fields.name === 'string' && fields.name.trim()
            ? fields.name
            : `Draft ${change.destination_id ?? change.id}`;
    const typeLabel =
        typeof fields.category === 'string' && fields.category.trim() ? fields.category : 'Unknown';

    return {
        id: change.id,
        changeRequestId: change.id,
        status: mapDraftStatus(change),
        name,
        type: typeLabel,
        createdBy: change.submitted_by ?? 'Unknown',
        adminName: change.reviewed_by ?? '—',
    };
};
// #endregion Mock Data & Logic


const DestinationManagement: React.FC<DestinationManagementProps> = ({ onNavigateToRequests }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [activeTab, setActiveTab] = useState<'published' | 'draft'>('published');
    const [publishedList, setPublishedList] = useState<Destination[]>([]);
    const [draftList, setDraftList] = useState<Destination[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit' | 'view'>('list'); 
    const [formDataForForm, setFormDataForForm] = useState<DestinationFormData | null>(null); // Data passed to DestinationForm
    const [isConfirmVisible, setIsConfirmVisible] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; handler: () => void; confirmText?: string; cancelText?: string; confirmButtonClass?: string } | null>(null);
    const [isSortOpen, setIsSortOpen] = useState(false); 
    const [isFilterOpen, setIsFilterOpen] = useState(false); 
    const [isOpenActionMenuId, setIsOpenActionMenuId] = useState<Destination['id'] | null>(null); // <<-- [แก้ไขที่ 14] State สำหรับ Action Menu
    const [isLoadingPublished, setIsLoadingPublished] = useState(false);
    const [publishedError, setPublishedError] = useState<string | null>(null);
    const [publishedReloadToken, setPublishedReloadToken] = useState(0);
    const [isLoadingDraft, setIsLoadingDraft] = useState(false);
    const [draftError, setDraftError] = useState<string | null>(null);
    const [draftReloadToken, setDraftReloadToken] = useState(0);

    const sortRef = useRef<HTMLDivElement>(null); // <<-- [แก้ไขที่ 15] Ref สำหรับ Sort
    const filterRef = useRef<HTMLDivElement>(null); // <<-- [แก้ไขที่ 16] Ref สำหรับ Filter

    const handleSearch = () => {
        console.log(`Search button clicked for: ${searchTerm}`);
    };

    const handleRetryPublished = () => {
        setPublishedReloadToken(prev => prev + 1);
    };

    const handleRetryDrafts = () => {
        setDraftReloadToken(prev => prev + 1);
    };

    const handleSubmitDraft = async (changeId?: string | null) => {
        console.log('[DestinationManagement] handleSubmitDraft called with changeId:', changeId);
        const effectiveId = typeof changeId === 'string' && changeId.trim() ? changeId : undefined;

        if (!effectiveId) {
            console.error('[DestinationManagement] Cannot submit draft without a valid change request ID', { changeId });
            setConfirmAction({
                title: 'Submission Failed',
                message: 'This draft cannot be submitted because it does not have a change request ID yet.',
                confirmText: 'Close',
                confirmButtonClass: 'bg-red-600 hover:bg-red-700',
                handler: () => {
                    setIsConfirmVisible(false);
                    setConfirmAction(null);
                }
            });
            setIsConfirmVisible(true);
            return;
        }
        try {
            console.log('[DestinationManagement] Submitting draft to backend with ID:', effectiveId);
            const response = await submitDestinationChange(effectiveId);
            const submittedId = response.change_request?.destination_id ?? response.change_request?.id ?? effectiveId;
            const serverMessage = response.message || `Destination ${submittedId} has been submitted for review.`;
            setConfirmAction({
                title: 'Submitted for Review',
                message: serverMessage,
                confirmText: 'OK',
                confirmButtonClass: 'bg-teal-600 hover:bg-teal-700',
                handler: () => {
                    setIsConfirmVisible(false);
                    setConfirmAction(null);
                    setDraftReloadToken(prev => prev + 1);
                    if (onNavigateToRequests) {
                        console.log('[DestinationManagement] Navigating to Destination Request page after submit');
                        onNavigateToRequests();
                    }
                }
            });
            setIsConfirmVisible(true);
        } catch (error) {
            console.error('[DestinationManagement] Failed to submit draft change request', error);
            setConfirmAction({
                title: 'Submission Failed',
                message: error instanceof Error ? error.message : 'Unable to submit draft for review.',
                confirmText: 'Close',
                confirmButtonClass: 'bg-red-600 hover:bg-red-700',
                handler: () => {
                    setIsConfirmVisible(false);
                    setConfirmAction(null);
                }
            });
            setIsConfirmVisible(true);
        }
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

    // Reset status filter when switching tabs
    useEffect(() => {
        setFilterStatus('');
    }, [activeTab]);

    useEffect(() => {
        if (activeTab !== 'published') {
            return;
        }

        let isCancelled = false;

        const fetchApprovedDestinations = async () => {
            setIsLoadingPublished(true);
            setPublishedError(null);
            try {
                const response = await fetchDestinationChanges({ status: 'approved', limit: 100, offset: 0 });
                if (isCancelled) {
                    return;
                }
                const mapped = response.changes.map(adaptApprovedChangeToDestination);
                setPublishedList(mapped);
            } catch (error) {
                if (isCancelled) {
                    return;
                }
                console.error('Failed to load published destinations', error);
                setPublishedError(error instanceof Error ? error.message : 'Unable to load published destinations');
                setPublishedList([]);
            } finally {
                if (!isCancelled) {
                    setIsLoadingPublished(false);
                }
            }
        };

        fetchApprovedDestinations();

        return () => {
            isCancelled = true;
        };
    }, [activeTab, publishedReloadToken]);

    useEffect(() => {
        if (activeTab !== 'draft') {
            return;
        }

        let isCancelled = false;

        const fetchDraftDestinations = async () => {
            setIsLoadingDraft(true);
            setDraftError(null);
            try {
                const response = await fetchDestinationChanges({ status: 'draft', limit: 100, offset: 0 });
                if (isCancelled) {
                    return;
                }
                setDraftList(response.changes.map(adaptDraftChangeToDestination));
            } catch (error) {
                if (isCancelled) {
                    return;
                }
                console.error('Failed to load draft destinations', error);
                setDraftError(error instanceof Error ? error.message : 'Unable to load draft destinations');
                setDraftList([]);
            } finally {
                if (!isCancelled) {
                    setIsLoadingDraft(false);
                }
            }
        };

        fetchDraftDestinations();

        return () => {
            isCancelled = true;
        };
    }, [activeTab, draftReloadToken]);

    // Ensure form view is visible when switching from list
    useEffect(() => {
        if (viewMode !== 'list') {
            try {
                const scroller = document.querySelector('main');
                if (scroller && 'scrollTo' in scroller) {
                    (scroller as HTMLElement).scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            } catch {
                // no-op for non-browser environments
            }
        }
    }, [viewMode]);

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
    const handleToggleActionMenu = (id: Destination['id']) => {
        setIsSortOpen(false); // ปิด Sort
        setIsFilterOpen(false); // ปิด Filter
        setIsOpenActionMenuId(prevId => prevId === id ? null : id); // Toggle หรือเปิดใหม่
    };

    const handleCloseActionMenu = () => {
        setIsOpenActionMenuId(null);
    };

    const dataSource = activeTab === 'published' ? publishedList : draftList;

    const filteredAndSortedData = useMemo(() => {
        return processDestinations(dataSource, searchTerm, sortBy, filterType, filterStatus);
    }, [dataSource, searchTerm, sortBy, filterType, filterStatus, activeTab]);


    const handleViewDetail = (id: Destination['id']) => {
        // Find in both Published and Draft datasets (state)
        const existingData = [...publishedList, ...draftList].find(d => d.id === id);
        if (existingData) {
            // For view mode, we need full data. Using mock for now.
            setFormDataForForm({
                ...mockViewDestinationData, // Use a comprehensive mock for view
                id: existingData.id,
                name: existingData.name,
                type: existingData.type,
                // Assume other fields are filled by a backend lookup
            });
            setIsOpenActionMenuId(null);
            setIsSortOpen(false);
            setIsFilterOpen(false);
            setViewMode('view');
        } else {
            console.error(`Destination with ID ${id} not found for view.`);
        }
    };

    const handleEditDetail = (id: Destination['id']) => {
        // Use mockEditDestinationData if ID matches, otherwise create generic mock from available record in state
        const existingData = [...publishedList, ...draftList].find(d => d.id === id);
        if (String(id) === '1') {
            setFormDataForForm(mockEditDestinationData);
        } else if (existingData) {
            setFormDataForForm({
                ...emptyDestinationInitialData,
                id: existingData.id,
                name: existingData.name,
                description: 'Description for mock edit.',
                contact: '0812345678',
                country: 'Thailand',
                city: 'Bangkok',
                latitude: 13.75,
                longitude: 100.5,
                openingTime: '08:00',
                closingTime: '17:00',
                type: existingData.type || 'Sightseeing',
                images: ['https://via.placeholder.com/150/FF5733/FFFFFF?text=MockEdit'],
            });
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
        setIsOpenActionMenuId(null);
        setIsSortOpen(false);
        setIsFilterOpen(false);
        setViewMode('edit');
    };

    const handleDeleteDestination = (id: Destination['id']) => {
        setConfirmAction({
            title: 'Confirm Delete Destination',
            message: `Are you sure you want to delete Destination ID: ${id}? This action cannot be undone.`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            confirmButtonClass: 'bg-red-600 hover:bg-red-700',
            handler: () => {
                console.log(`Deleting Destination ID: ${id}`);
                // Remove from the appropriate list
                setPublishedList(prev => prev.filter(d => d.id !== id));
                setDraftList(prev => prev.filter(d => d.id !== id));
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
                        // Stay on current tab
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
                if (viewMode === 'add') {
                    // Generate new ID and push to draft list with status 'Add'
                    const numericIds = [...publishedList, ...draftList]
                        .map(d => (typeof d.id === 'number' ? d.id : Number.parseInt(String(d.id), 10)))
                        .filter((value): value is number => Number.isFinite(value));
                    const newId = (numericIds.length ? Math.max(...numericIds) : 0) + 1;
                    const localChangeId = `local-draft-${newId}-${Date.now()}`;
                    const newDraft: Destination = {
                        id: newId,
                        changeRequestId: localChangeId,
                        status: 'Add',
                        name: data.name,
                        type: data.type || 'Sightseeing',
                        createdBy: 'S000000',
                        adminName: 'Admin',
                    };
                    setDraftList(prev => [newDraft, ...prev]);
                    setActiveTab('draft');
                } else if (viewMode === 'edit' && data.id !== null) {
                    // Apply simple mock update: reflect name/type to whichever list contains it
                    setPublishedList(prev => prev.map(d => d.id === data.id ? { ...d, name: data.name, type: data.type } : d));
                    setDraftList(prev => prev.map(d => d.id === data.id ? { ...d, name: data.name, type: data.type, status: 'Edit' } : d));
                }
                setConfirmAction({
                    title: 'Success!',
                    message: `${data.name} has been successfully ${viewMode === 'add' ? 'added to Draft' : 'updated'}.`,
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
    const handleFormDelete = (id: Destination['id']) => {
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
                            <button type='button'
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
                                        <button type='button'
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
                            <button type='button'
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
                                            options={activeTab === 'published' 
                                                ? [
                                                    { value: 'Active', label: 'Active' },
                                                    { value: 'Inactive', label: 'Inactive' }
                                                  ]
                                                : [
                                                    { value: 'Add', label: 'Add' },
                                                    { value: 'Edit', label: 'Edit' },
                                                    { value: 'Delete', label: 'Delete' },
                                                    { value: 'Reject', label: 'Reject' },
                                                  ]
                                            }
                                            onChange={setFilterStatus}
                                            placeholder="All Statuses"
                                            className="w-full"
                                        />
                                    </div>
                                    
                                    <div className="flex justify-end pt-2">
                                        <button  type='button'
                                            onClick={() => {setFilterType(''); setFilterStatus(''); setIsFilterOpen(false);}}
                                            className="text-sm text-red-500 hover:text-red-700 transition-colors"
                                        >
                                            Clear Filters
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button  type='button'
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
                
                {/* Tabs */}
                <div className="flex w-full rounded-t-xl overflow-hidden">
                    <button type='button'
                        onClick={() => setActiveTab('published')}
                        className={`flex-1 px-4 py-2 text-sm font-medium border ${activeTab === 'published' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                    >
                        Published Destination
                    </button>
                    <button type='button'
                        onClick={() => setActiveTab('draft')}
                        className={`flex-1 px-4 py-2 text-sm font-medium border-t border-b ${activeTab === 'draft' ? 'bg-indigo-100 text-indigo-800 border-indigo-300' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                    >
                        Draft
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-lg overflow-visible mt-2">
                    <table className="min-w-full table-fixed divide-y divide-gray-200">
                        <colgroup>
                            <col style={{ width: '12%' }} />
                            <col style={{ width: '12%' }} />
                            <col style={{ width: '36%' }} />
                            <col style={{ width: '12%' }} />
                            <col style={{ width: '12%' }} />
                            <col style={{ width: '12%' }} />
                            <col style={{ width: '4%' }} />
                        </colgroup>
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
                            {activeTab === 'published' && isLoadingPublished ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500 text-lg">
                                        Loading published destinations...
                                    </td>
                                </tr>
                            ) : activeTab === 'published' && publishedError ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                        <div className="space-y-3">
                                            <p className="text-sm text-red-600 font-medium">
                                                Failed to load published destinations.
                                            </p>
                                            <p className="text-xs text-gray-500 break-words">
                                                {publishedError}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={handleRetryPublished}
                                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                                            >
                                                Retry
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : activeTab === 'draft' && isLoadingDraft ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500 text-lg">
                                        Loading draft destinations...
                                    </td>
                                </tr>
                            ) : activeTab === 'draft' && draftError ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                        <div className="space-y-3">
                                            <p className="text-sm text-red-600 font-medium">
                                                Failed to load draft destinations.
                                            </p>
                                            <p className="text-xs text-gray-500 break-words">
                                                {draftError}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={handleRetryDrafts}
                                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                                            >
                                                Retry
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredAndSortedData.length > 0 ? (
                                filteredAndSortedData.map((destination, index) => (
                                    <tr
                                        key={destination.changeRequestId ?? `${destination.id}-${index}`}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
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
                                                options={activeTab === 'published' ? [
                                                    { value: 'view', label: 'View Detail', action: () => handleViewDetail(destination.id) },
                                                    { value: 'edit', label: 'Edit Detail', action: () => handleEditDetail(destination.id) },
                                                ] : [
                                                    { value: 'edit', label: 'Edit Detail', action: () => handleEditDetail(destination.id) },
                                                    { value: 'pending', label: 'Submit for Review', action: () => {
                                                        console.log('[DestinationManagement] Submit for Review clicked for destination:', {
                                                            id: destination.id,
                                                            changeRequestId: destination.changeRequestId,
                                                        });
                                                        setConfirmAction({
                                                            title: 'Submit for Review',
                                                            message: `Submit draft ID: ${destination.id} for review?`,
                                                            confirmText: 'Submit',
                                                            cancelText: 'Cancel',
                                                            confirmButtonClass: 'bg-teal-600 hover:bg-teal-700',
                                                            handler: () => {
                                                                setIsConfirmVisible(false);
                                                                setConfirmAction(null);
                                                                handleSubmitDraft(destination.changeRequestId ?? (typeof destination.id === 'string' ? destination.id : null));
                                                            }
                                                        });
                                                        setIsConfirmVisible(true);
                                                    } },
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
