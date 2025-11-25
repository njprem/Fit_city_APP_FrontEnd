import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, ChevronDown, ArrowDownWideNarrow, SlidersHorizontal, FileDown, Upload, ListChecks } from 'lucide-react'; 

import SearchBar from '../Admin_Component/SearchBar';
import Dropdown from '../Admin_Component/Dropdown';
import ConfirmPopup from '../Admin_Component/Confirm_Popup';
import DestinationForm from '../Admin_Component/Destination_Form';
import { emptyDestinationInitialData, type DestinationFormData } from '../Admin_Component/destinationFormData';
import StatusPill, { type StatusType } from '../Admin_Component/StatusPill';
import ActionMenu, { type ActionOption } from '../Admin_Component/ActionMenu';
import { createDestinationChange, fetchDestinationChanges, fetchDestinationImportJob, fetchDestinationImportTemplate, updateDestinationChange, fetchPublishedDestinations, submitDestinationChange, uploadDestinationGallery, uploadDestinationHeroImage, uploadDestinationImport, downloadDestinationImportErrors, type DestinationChange, type DestinationChangeDetailResponse, type DestinationChangeFields, type DestinationImportJob, type DestinationImportRow } from '../../api';
import type { Destination as TravelerDestination } from '../../types/destination';

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
    destinationId?: string | null;
    details?: DestinationChange['fields'];
    change?: DestinationChange;
}

// ** Updated Type Options **
const typeOptions = [
    { value: 'Culture', label: 'Culture' },
    { value: 'Food', label: 'Food' },
    { value: 'Nature', label: 'Nature' },
    { value: 'Sport', label: 'Sport' },
];

const fallbackImportTemplate = {
    headers: [
        'slug',
        'name',
        'status',
        'category',
        'city',
        'country',
        'description',
        'latitude',
        'longitude',
        'contact',
        'opening_time',
        'closing_time',
        'hero_image_url',
        'gallery_1_url',
        'gallery_1_caption',
        'gallery_2_url',
        'gallery_2_caption',
        'gallery_3_url',
        'gallery_3_caption',
        'hero_image_upload_id',
        'published_hero_image',
    ],
    sampleRow: [
        'central-park',
        'Central Park',
        'published',
        'Nature',
        'New York',
        'USA',
        'Iconic urban park with year-round programming.',
        '40.785091',
        '-73.968285',
        '+1 212-310-6600',
        '06:00',
        '22:00',
        'https://cdn.fitcity/destinations/central-park/hero.jpg',
        'https://cdn.fitcity/destinations/central-park/gallery-1.jpg',
        'Bethesda Fountain',
        'https://cdn.fitcity/destinations/central-park/gallery-2.jpg',
        'Bow Bridge',
        '',
        '',
        '',
        '',
    ],
};

const sortOptions = [
    { value: 'id_low', label: 'ID (Low to High)' },
    { value: 'id_high', label: 'ID (High to Low)' },
    { value: 'name_asc', label: 'Name (A-Z)' },
    { value: 'name_desc', label: 'Name (Z-A)' },
];

const pageSizeOptions = [25, 50, 100, 200];

const getPageNumbers = (current: number, total: number): number[] => {
    if (total <= 5) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 3) {
        return [1, 2, 3, 4, 5];
    }
    if (current >= total - 2) {
        return [total - 4, total - 3, total - 2, total - 1, total];
    }
    return [current - 2, current - 1, current, current + 1, current + 2];
};

const processDestinations = (
    data: Destination[],
    searchTerm: string,
    sortBy: string,
    filterType: string,
    filterStatus: string,
    isDraftTab: boolean
): Destination[] => {
    let result = [...data];

    // 1. Filter by Search Term
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        result = result.filter(dest => {
            const matchName = dest.name.toLowerCase().includes(term);
            const matchId = dest.id.toString().toLowerCase().includes(term);
            const matchDestinationId = dest.destinationId ? dest.destinationId.toString().toLowerCase().includes(term) : false;
            const matchChangeId = isDraftTab && dest.changeRequestId ? dest.changeRequestId.toString().toLowerCase().includes(term) : false;
            return matchName || matchId || matchDestinationId || matchChangeId;
        });
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

const toNumberOrNull = (value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return null;
};

const collectImageSources = (fields?: DestinationChange['fields']): string[] => {
    if (!fields) return [];
    const images = new Set<string>();
    const pushIfValid = (candidate?: unknown) => {
        if (typeof candidate === 'string') {
            const trimmed = candidate.trim();
            if (trimmed) images.add(trimmed);
        }
    };

    pushIfValid(fields.hero_image_url as string | undefined);
    pushIfValid(fields.published_hero_image as string | undefined);

    if (Array.isArray(fields.gallery)) {
        fields.gallery.forEach((item) => {
            if (item && typeof item === 'object' && 'url' in item) {
                pushIfValid(item.url as string | undefined);
            }
        });
    }

    return Array.from(images);
};

const mapPublishedRecordStatus = (status?: string): StatusType => {
    const normalized = (status ?? '').toLowerCase();
    if (normalized === 'inactive') {
        return 'Inactive';
    }
    return 'Active';
};

const adaptPublishedRecordToDestination = (record: TravelerDestination): Destination => {
    const details: DestinationChange['fields'] = {
        name: record.name,
        category: record.category,
        status: record.status,
        city: record.city,
        country: record.country,
        description: record.description,
        opening_time: record.opening_time,
        closing_time: record.closing_time,
        contact: record.contact,
        latitude: record.latitude,
        longitude: record.longitude,
        hero_image_url: record.hero_image_url,
        gallery: Array.isArray(record.gallery)
            ? record.gallery.map((image, index) => ({
                url: image.url,
                caption: image.caption,
                ordering: typeof image.ordering === 'number' ? image.ordering : index,
            }))
            : undefined,
    };

    return {
        id: record.id,
        destinationId: record.id,
        changeRequestId: undefined,
        status: mapPublishedRecordStatus(record.status),
        name: record.name,
        type: record.category,
        createdBy: record.updated_by ?? '—',
        adminName: record.updated_by ?? '—',
        details,
        change: undefined,
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

    // ใช้ full_name ถ้ามี ไม่เช่นนั้นใช้ username หรือ UUID
    const createdBy = change.submitted_by_full_name 
        ?? change.submitted_by_username 
        ?? change.submitted_by 
        ?? 'Unknown';
    
    const adminName = change.reviewed_by_full_name 
        ?? change.reviewed_by_username 
        ?? change.reviewed_by 
        ?? '—';

    return {
        id: change.id,
        changeRequestId: change.id,
        destinationId: change.destination_id ?? null,
        status: mapDraftStatus(change),
        name,
        type: typeLabel,
        createdBy,
        adminName,
        details: change.fields,
        change,
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
    const [editingDestinationId, setEditingDestinationId] = useState<string | null>(null);
    const [editingChangeRequestId, setEditingChangeRequestId] = useState<string | null>(null);
    const [editingDraftVersion, setEditingDraftVersion] = useState<number | null>(null);
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
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importNotes, setImportNotes] = useState('');
    const [importDryRun, setImportDryRun] = useState(false);
    const [importAutoSubmit, setImportAutoSubmit] = useState(true);
    const [isUploadingImport, setIsUploadingImport] = useState(false);
    const [isJobModalOpen, setIsJobModalOpen] = useState(false);
    const [jobIdInput, setJobIdInput] = useState('');
    const [jobDetails, setJobDetails] = useState<DestinationImportJob | null>(null);
    const [jobRows, setJobRows] = useState<DestinationImportRow[]>([]);
    const [jobStatusError, setJobStatusError] = useState<string | null>(null);
    const [jobLoading, setJobLoading] = useState(false);
    const [lastJobId, setLastJobId] = useState<string | null>(null);
    const [publishedPage, setPublishedPage] = useState(1);
    const [draftPage, setDraftPage] = useState(1);
    const [publishedPageSize, setPublishedPageSize] = useState(25);
    const [draftPageSize, setDraftPageSize] = useState(25);
    const [publishedTotal, setPublishedTotal] = useState(0);
    const [draftTotal, setDraftTotal] = useState(0);

    const sortRef = useRef<HTMLDivElement>(null); // <<-- [แก้ไขที่ 15] Ref สำหรับ Sort
    const filterRef = useRef<HTMLDivElement>(null); // <<-- [แก้ไขที่ 16] Ref สำหรับ Filter

    const handleSearch = () => {
        // Search functionality
    };

    const reloadPublishedList = () => {
        setPublishedReloadToken(prev => prev + 1);
    };

    const reloadDraftList = () => {
        setDraftReloadToken(prev => prev + 1);
    };

    const submitDraftChangeRequest = async (changeId?: string | null) => {
        const effectiveId = typeof changeId === 'string' && changeId.trim() ? changeId : undefined;

        if (!effectiveId) {
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
        if (activeTab === 'published') {
            setPublishedPage(1);
        } else {
            setDraftPage(1);
        }
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'published') {
            setPublishedPage(1);
        } else {
            setDraftPage(1);
        }
    }, [searchTerm, sortBy, filterType, filterStatus, activeTab, publishedPageSize, draftPageSize]);

    useEffect(() => {
        const maxPages = Math.max(1, Math.ceil(publishedTotal / publishedPageSize));
        setPublishedPage(prev => Math.min(prev, maxPages));
    }, [publishedTotal, publishedPageSize]);

    useEffect(() => {
        const maxPages = Math.max(1, Math.ceil(draftTotal / draftPageSize));
        setDraftPage(prev => Math.min(prev, maxPages));
    }, [draftTotal, draftPageSize]);

    useEffect(() => {
        if (activeTab !== 'published') {
            return;
        }

        let isCancelled = false;

        const fetchApprovedDestinations = async () => {
            setIsLoadingPublished(true);
            setPublishedError(null);
            try {
                const response = await fetchPublishedDestinations({
                    limit: publishedPageSize,
                    offset: (publishedPage - 1) * publishedPageSize,
                    query: searchTerm.trim() || undefined,
                    categories: filterType || undefined,
                });
                if (isCancelled) {
                    return;
                }
                const mapped = response.destinations.map(adaptPublishedRecordToDestination);
                setPublishedList(mapped);
                const meta = response.meta ?? {};
                setPublishedTotal((meta as { total?: number; count?: number }).total ?? meta.count ?? response.destinations.length ?? 0);
            } catch (error) {
                if (isCancelled) {
                    return;
                }
                console.error('Failed to load published destinations', error);
                setPublishedError(error instanceof Error ? error.message : 'Unable to load published destinations');
                setPublishedList([]);
                setPublishedTotal(0);
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
    }, [activeTab, publishedReloadToken, publishedPage, publishedPageSize, searchTerm, filterType]);

    useEffect(() => {
        if (activeTab !== 'draft') {
            return;
        }

        let isCancelled = false;

        const fetchDraftDestinations = async () => {
            setIsLoadingDraft(true);
            setDraftError(null);
            try {
                const response = await fetchDestinationChanges({
                    status: 'draft',
                    limit: draftPageSize,
                    offset: (draftPage - 1) * draftPageSize,
                });
                if (isCancelled) {
                    return;
                }
                const mapped = response.changes.map(adaptDraftChangeToDestination);
                setDraftList(mapped);
                const meta = response.meta ?? {};
                setDraftTotal((meta as { total?: number; count?: number }).total ?? meta.count ?? response.changes.length ?? 0);
            } catch (error) {
                if (isCancelled) {
                    return;
                }
                console.error('Failed to load draft destinations', error);
                setDraftError(error instanceof Error ? error.message : 'Unable to load draft destinations');
                setDraftList([]);
                setDraftTotal(0);
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
    }, [activeTab, draftReloadToken, draftPage, draftPageSize]);

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
        // แปลง id เป็น string เพื่อเปรียบเทียบให้ถูกต้อง
        const idStr = String(id);
        setIsOpenActionMenuId(prevId => {
            const prevIdStr = prevId !== null ? String(prevId) : null;
            return prevIdStr === idStr ? null : id;
        });
    };

    const handleCloseActionMenu = () => {
        setIsOpenActionMenuId(null);
    };

    const dataSource = activeTab === 'published' ? publishedList : draftList;

    const filteredAndSortedData = useMemo(() => {
        return processDestinations(dataSource, searchTerm, sortBy, filterType, filterStatus, activeTab === 'draft');
    }, [dataSource, searchTerm, sortBy, filterType, filterStatus, activeTab]);

    const pageSize = activeTab === 'published' ? publishedPageSize : draftPageSize;
    const currentPage = activeTab === 'published' ? publishedPage : draftPage;
    const totalCount = activeTab === 'published' ? publishedTotal : draftTotal;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const paginatedData = filteredAndSortedData;


    const resetOverlays = () => {
        setIsSortOpen(false);
        setIsFilterOpen(false);
        setIsOpenActionMenuId(null);
    };

    const escapeCsv = (value: unknown): string => {
        const text = value === null || value === undefined ? '' : String(value);
        const escaped = text.replace(/"/g, '""');
        return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
    };

    const downloadCsv = (headers: string[], sample: string[]) => {
        const rows = [headers, sample].filter(row => row.length > 0);
        const csvContent = rows.map(row => row.map(escapeCsv).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'destination-import-template.csv';
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleDownloadTemplate = async () => {
        resetOverlays();
        let headers: string[] = [];
        let sample: string[] = [];
        let usedFallback = false;

        try {
            const { template } = await fetchDestinationImportTemplate();
            headers = template?.headers ?? [];
            sample = template?.sample_row ?? [];
        } catch (error) {
            console.error('[Template Download] falling back to baked template', error);
            headers = fallbackImportTemplate.headers;
            sample = fallbackImportTemplate.sampleRow;
            usedFallback = true;
        }

        if (!headers.length) {
            setConfirmAction({
                title: 'Template Download Failed',
                message: 'Template is empty or unavailable.',
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

        downloadCsv(headers, sample);

        if (usedFallback) {
            setConfirmAction({
                title: 'Template Downloaded (Fallback)',
                message: 'Live template endpoint unavailable. Downloaded the documented sample instead.',
                confirmText: 'OK',
                confirmButtonClass: 'bg-indigo-600 hover:bg-indigo-700',
                handler: () => {
                    setIsConfirmVisible(false);
                    setConfirmAction(null);
                }
            });
            setIsConfirmVisible(true);
        }
    };

    const handleOpenImportModal = () => {
        resetOverlays();
        setImportFile(null);
        setImportNotes('');
        setImportDryRun(false);
        setImportAutoSubmit(true);
        setIsImportModalOpen(true);
    };

    const handleCloseImportModal = () => {
        setIsImportModalOpen(false);
        setIsUploadingImport(false);
    };

    const fetchAndSetJob = async (jobId: string) => {
        const trimmedId = jobId.trim();
        if (!trimmedId) {
            setJobStatusError('Please provide a job ID.');
            setJobDetails(null);
            setJobRows([]);
            return;
        }

        setJobLoading(true);
        setJobStatusError(null);
        try {
            const response = await fetchDestinationImportJob(trimmedId);
            setJobDetails(response.job);
            setJobRows(response.rows ?? []);
            setLastJobId(trimmedId);
        } catch (error) {
            setJobDetails(null);
            setJobRows([]);
            setJobStatusError(error instanceof Error ? error.message : 'Unable to load import job.');
        } finally {
            setJobLoading(false);
        }
    };

    const handleOpenJobModal = (jobId?: string) => {
        resetOverlays();
        setJobStatusError(null);
        const nextJobId = jobId ?? lastJobId ?? '';
        if (nextJobId) {
            setJobIdInput(nextJobId);
            fetchAndSetJob(nextJobId);
        }
        setIsJobModalOpen(true);
    };

    const handleSubmitImport = async (event?: React.FormEvent<HTMLFormElement>) => {
        if (event) {
            event.preventDefault();
        }
        if (!importFile) {
            setConfirmAction({
                title: 'File Required',
                message: 'Please select a CSV file before uploading.',
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

        setIsUploadingImport(true);
        try {
            const response = await uploadDestinationImport(importFile, {
                dry_run: importDryRun,
                submit: importAutoSubmit,
                notes: importNotes.trim() || undefined,
            });
            const jobId = response.job?.id;
            if (jobId) {
                setLastJobId(jobId);
                setJobIdInput(jobId);
            }
            setJobDetails(response.job ?? null);
            setJobRows(response.rows ?? []);
            setIsImportModalOpen(false);
            setImportFile(null);

            setConfirmAction({
                title: importDryRun ? 'Dry Run Started' : 'Import Started',
                message: jobId
                    ? `Job ${jobId} is ${response.job?.status ?? 'queued'}. You can monitor its progress in the job viewer.`
                    : 'Import created successfully.',
                confirmText: 'View Job',
                cancelText: 'Close',
                confirmButtonClass: 'bg-indigo-600 hover:bg-indigo-700',
                handler: () => {
                    setIsConfirmVisible(false);
                    setConfirmAction(null);
                    handleOpenJobModal(jobId || undefined);
                }
            });
            setIsConfirmVisible(true);
        } catch (error) {
            setConfirmAction({
                title: 'Import Failed',
                message: error instanceof Error ? error.message : 'Unable to upload CSV.',
                confirmText: 'Close',
                confirmButtonClass: 'bg-red-600 hover:bg-red-700',
                handler: () => {
                    setIsConfirmVisible(false);
                    setConfirmAction(null);
                }
            });
            setIsConfirmVisible(true);
        } finally {
            setIsUploadingImport(false);
        }
    };

    const handleDownloadErrors = async () => {
        const jobId = (jobDetails?.id ?? jobIdInput ?? lastJobId ?? '').trim();
        if (!jobId) {
            setConfirmAction({
                title: 'Job ID Required',
                message: 'Enter or load a job before downloading errors.',
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
            const blob = await downloadDestinationImportErrors(jobId);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `destination-import-errors-${jobId}.csv`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            setConfirmAction({
                title: 'Download Failed',
                message: error instanceof Error ? error.message : 'Unable to download error CSV.',
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

    const buildFormDataForAction = (destination?: Destination): DestinationFormData => {
        const details = (destination?.change?.fields ?? destination?.details ?? {}) as Record<string, unknown>;
        const ensureString = (value: unknown, fallback = ''): string =>
            typeof value === 'string' ? value : fallback;
        const ensureNumber = (value: unknown): number | null => {
            if (typeof value === 'number' && Number.isFinite(value)) return value;
            if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
                return Number(value);
            }
            return null;
        };

        const galleryFromFields =
            Array.isArray(details.gallery)
                ? (details.gallery as Array<{ url?: string }>)
                    .map(g => g?.url)
                    .filter((url): url is string => Boolean(url))
                : [];

        const heroImage = ensureString(details.hero_image_url, '');
        const images: string[] = [];
        if (heroImage) images.push(heroImage);
        galleryFromFields.forEach((u) => images.push(u));

        return {
            ...emptyDestinationInitialData,
            id: destination?.id ?? null,
            name: ensureString(details.name, destination?.name ?? ''),
            type: ensureString(details.category, destination?.type ?? ''),
            contact: ensureString(details.contact, ''),
            country: ensureString(details.country, ''),
            city: ensureString(details.city, ''),
            latitude: ensureNumber(details.latitude),
            longitude: ensureNumber(details.longitude),
            openingTime: ensureString(details.opening_time, emptyDestinationInitialData.openingTime),
            closingTime: ensureString(details.closing_time, emptyDestinationInitialData.closingTime),
            description: ensureString(details.description, ''),
            images,
            imageFiles: [],
        };
    };

    const mapFormToDetails = (data: DestinationFormData): DestinationChangeFields => ({
        name: data.name,
        category: data.type,
        contact: data.contact,
        country: data.country,
        city: data.city,
        latitude: data.latitude ?? undefined,
        longitude: data.longitude ?? undefined,
        opening_time: data.openingTime,
        closing_time: data.closingTime,
        description: data.description,
        hero_image_url: data.images?.[0],
        published_hero_image: data.images?.[0],
        gallery: data.images?.map((url, index) => ({ url, ordering: index })) ?? [],
    });

    const mapChangeDetailToFormData = (change: DestinationChangeDetailResponse['change_request'] | DestinationChange): DestinationFormData => {
        const fields = change.fields ?? {};
        const base = { ...emptyDestinationInitialData };

        return {
            ...base,
            id: change.destination_id ?? change.id ?? base.id,
            name: typeof fields.name === 'string' ? fields.name : base.name,
            type: typeof fields.category === 'string' ? fields.category : base.type,
            contact: typeof fields.contact === 'string' ? fields.contact : base.contact,
            country: typeof fields.country === 'string' ? fields.country : base.country,
            city: typeof fields.city === 'string' ? fields.city : base.city,
            latitude: toNumberOrNull(fields.latitude) ?? base.latitude,
            longitude: toNumberOrNull(fields.longitude) ?? base.longitude,
            openingTime: typeof fields.opening_time === 'string' ? fields.opening_time : base.openingTime,
            closingTime: typeof fields.closing_time === 'string' ? fields.closing_time : base.closingTime,
            description: typeof fields.description === 'string' ? fields.description : base.description,
            images: collectImageSources(fields),
            imageFiles: [],
        };
    };

    const openForm = (mode: 'add' | 'edit' | 'view', destination?: Destination) => {
        setFormDataForForm(mode === 'add' ? emptyDestinationInitialData : buildFormDataForAction(destination));
        setViewMode(mode);
        resetOverlays();
    };

    const resolveDestinationIdForDelete = (destination?: Destination, fallback?: Destination['id']): string | null => {
        if (destination?.destinationId) {
            return destination.destinationId;
        }
        if (destination?.change?.destination_id) {
            return String(destination.change.destination_id);
        }
        if (typeof fallback === 'string') {
            return fallback;
        }
        if (typeof fallback === 'number') {
            return String(fallback);
        }
        return null;
    };

    const handleDeleteDestination = (id: Destination['id']) => {
        const target = [...publishedList, ...draftList].find(d => d.id === id);
        setConfirmAction({
            title: 'Confirm Delete Destination',
            message: target ? `Are you sure you want to delete "${target.name}" (ID: ${target.destinationId ?? id})? This action cannot be undone.` : `Are you sure you want to delete Destination ID: ${id}? This action cannot be undone.`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            confirmButtonClass: 'bg-red-600 hover:bg-red-700',
            handler: () => {
                setIsConfirmVisible(false);
                (async () => {
                    const destinationId = resolveDestinationIdForDelete(target, id);
                    if (!destinationId) {
                        setConfirmAction({
                            title: 'Delete Failed',
                            message: 'Unable to determine destination ID for deletion.',
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
                        const deleteFields: DestinationChangeFields = {
                            ...(target?.details ?? {}),
                            status: 'inactive',
                            hard_delete: false,
                        };
                        await createDestinationChange({
                            action: 'delete',
                            destination_id: destinationId,
                            fields: deleteFields,
                        });
                        setDraftReloadToken(prev => prev + 1);
                        setPublishedReloadToken(prev => prev + 1);
                        setActiveTab('draft');
                        setConfirmAction({
                            title: 'Deletion Request Created',
                            message: `Delete draft for destination ID: ${destinationId} has been created. Please submit it for review.`,
                            confirmText: 'OK',
                            confirmButtonClass: 'bg-teal-600 hover:bg-teal-700',
                            handler: () => {
                                setIsConfirmVisible(false);
                                setConfirmAction(null);
                                setViewMode('list'); 
                                setFormDataForForm(null);
                                setEditingDestinationId(null);
                                setEditingChangeRequestId(null);
                            }
                        });
                    } catch (error) {
                        setConfirmAction({
                            title: 'Delete Failed',
                            message: error instanceof Error ? error.message : 'Unable to create delete request.',
                            confirmText: 'Close',
                            confirmButtonClass: 'bg-red-600 hover:bg-red-700',
                            handler: () => {
                                setIsConfirmVisible(false);
                                setConfirmAction(null);
                            }
                        });
                    } finally {
                        setIsConfirmVisible(true);
                    }
                })();
            }
        });
        setIsConfirmVisible(true);
        resetOverlays();
    };

    const handleRowAction = (action: 'view' | 'edit', destination: Destination) => {
        resetOverlays();
        
        const changeRequestId = destination.changeRequestId ? String(destination.changeRequestId) : null;
        const resolvedDestinationId =
            typeof destination.change?.destination_id === 'string'
                ? destination.change.destination_id
                : destination.id !== undefined && destination.id !== null
                    ? String(destination.id)
                    : null;

        if (action === 'edit') {
            if (!changeRequestId && !resolvedDestinationId) {
                setConfirmAction({
                    title: 'Unable to Open',
                    message: 'No destination ID found for this item.',
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
            setEditingDestinationId(resolvedDestinationId);
            setEditingChangeRequestId(changeRequestId);
            setEditingDraftVersion(
                typeof destination.change?.draft_version === 'number' ? destination.change.draft_version : null
            );
        } else {
            setEditingDestinationId(null);
            setEditingChangeRequestId(null);
            setEditingDraftVersion(null);
        }


        const fallbackFormData: DestinationFormData = {
            ...emptyDestinationInitialData,
            id: destination.id ?? null,
            name: destination.name ?? '',
            type: destination.type ?? '',
        };

        const initialFormData = destination.change
            ? mapChangeDetailToFormData(destination.change)
            : destination.details
                ? buildFormDataForAction(destination)
                : fallbackFormData;

        setFormDataForForm(initialFormData);
        setViewMode(action);
        setIsDetailLoading(false);
    };

    const handleAddNew = () => {
        setEditingDestinationId(null);
        setEditingChangeRequestId(null);
        setEditingDraftVersion(null);
        openForm('add');
    };

    const showSubmitDraftConfirm = (destination: Destination) => {
        const targetId = destination.changeRequestId ?? (typeof destination.id === 'string' ? destination.id : null);
        setConfirmAction({
            title: 'Submit for Review',
            message: `Submit draft ID: ${destination.id} for review?`,
            confirmText: 'Submit',
            cancelText: 'Cancel',
            confirmButtonClass: 'bg-teal-600 hover:bg-teal-700',
            handler: () => {
                setIsConfirmVisible(false);
                setConfirmAction(null);
                submitDraftChangeRequest(targetId);
            }
        });
        setIsConfirmVisible(true);
    };

    const buildActionMenuOptions = (destination: Destination): ActionOption[] => {
        const baseOptions: ActionOption[] = [
            { 
                value: 'view', 
                label: 'View Detail', 
                action: () => handleRowAction('view', destination)
            },
            { 
                value: 'edit', 
                label: 'Edit Detail', 
                action: () => handleRowAction('edit', destination)
            },
        ];

        if (activeTab === 'draft') {
            baseOptions.push({
                value: 'pending',
                label: 'Review Pending',
                action: () => showSubmitDraftConfirm(destination),
            });
        }

        return baseOptions;
    };


    const handleSaveForm = (data: DestinationFormData, imageFiles: File[]) => {
        const detailsFromForm = mapFormToDetails(data);

        const uploadImagesIfNeeded = async (changeId: string) => {
            if (!imageFiles || imageFiles.length === 0) return;
            const [hero, ...gallery] = imageFiles;
            if (hero) {
                await uploadDestinationHeroImage(changeId, hero);
            }
            if (gallery.length > 0) {
                await uploadDestinationGallery(changeId, gallery);
            }
        };

        setConfirmAction({
            title: viewMode === 'add' ? 'Confirm Add New Destination' : 'Confirm Save Changes',
            message: viewMode === 'add' ? 'Are you sure you want to add this destination? Please ensure all details are correct.' : `Are you sure you want to save changes to ID ${data.id}?`,
            confirmText: viewMode === 'add' ? 'Add Destination' : 'Save Changes',
            confirmButtonClass: 'bg-green-500 hover:bg-green-600',
            handler: () => {
                (async () => {
                    try {
                        if (viewMode === 'add') {
                            const res = await createDestinationChange({
                                action: 'create',
                                fields: detailsFromForm,
                            });
                            const changeId = res.change_request.id;
                            await uploadImagesIfNeeded(changeId);
                            setDraftReloadToken(prev => prev + 1);
                            setActiveTab('draft');
                        } else if (viewMode === 'edit') {
                            if (editingChangeRequestId) {
                                await updateDestinationChange(editingChangeRequestId, {
                                    draft_version: editingDraftVersion ?? undefined,
                                    fields: detailsFromForm,
                                });
                                await uploadImagesIfNeeded(editingChangeRequestId);
                                setDraftReloadToken(prev => prev + 1);
                            } else {
                                const resolvedDestinationId =
                                    editingDestinationId ??
                                    (data.id !== null && data.id !== undefined ? String(data.id) : null);
                                if (!resolvedDestinationId) {
                                    throw new Error('Missing destination id for update.');
                                }
                                const res = await createDestinationChange({
                                    action: 'update',
                                    destination_id: resolvedDestinationId,
                                    fields: detailsFromForm,
                                });
                                const changeId = res.change_request.id;
                                await uploadImagesIfNeeded(changeId);
                                setDraftReloadToken(prev => prev + 1);
                                setActiveTab('draft');
                            }
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
                        setEditingDestinationId(null);
                        setEditingChangeRequestId(null);
                        setEditingDraftVersion(null);
                    }
                });
                    } catch (error) {
                        setConfirmAction({
                            title: 'Save Failed',
                            message: error instanceof Error ? error.message : 'Unable to save destination.',
                            confirmText: 'Close',
                            confirmButtonClass: 'bg-red-600 hover:bg-red-700',
                            handler: () => {
                                setIsConfirmVisible(false);
                                setConfirmAction(null);
                            }
                        });
                    } finally {
                        setIsConfirmVisible(true);
                    }
                })();
            }
        });
        setIsConfirmVisible(true);
    };

    const handleCancelForm = () => {
        setViewMode('list');
        setFormDataForForm(null);
        setEditingDestinationId(null);
        setEditingChangeRequestId(null);
        setEditingDraftVersion(null);
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

    const handleFormChange = (next: DestinationFormData) => {
        setFormDataForForm(next);
    };
    
    // Render list view
   const listView = (
            <div className="p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Destination Management</h1>
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                    <SearchBar 
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        onSearch={handleSearch}
                        placeholder={activeTab === 'draft' ? 'Find draft by ID, destination ID, or name...' : 'Find Destination Name or ID...'}
                    />
                   <div className="flex flex-wrap gap-3 justify-end">
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

                        <button
                            type='button'
                            onClick={handleDownloadTemplate}
                            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm text-sm"
                        >
                            <FileDown className="w-4 h-4 mr-2" />
                            Download CSV
                        </button>

                        <button
                            type='button'
                            onClick={handleOpenImportModal}
                            className="flex items-center px-4 py-2 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition-colors shadow-sm text-sm font-medium"
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            Import CSV
                        </button>

                        <button
                            type='button'
                            onClick={() => handleOpenJobModal()}
                            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm text-sm"
                        >
                            <ListChecks className="w-4 h-4 mr-2" />
                            Check Import Job
                        </button>

                        <button  type='button'
                            onClick={handleAddNew}
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
                                            <p className="text-xs text-gray-500 wrap-break-word">
                                                {publishedError}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={reloadPublishedList}
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
                                            <p className="text-xs text-gray-500 wrap-break-word">
                                                {draftError}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={reloadDraftList}
                                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                                            >
                                                Retry
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : paginatedData.length > 0 ? (
                                paginatedData.map((destination, index) => (
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
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                                            <ActionMenu
                                                options={buildActionMenuOptions(destination)}
                                                isOpen={isOpenActionMenuId !== null && String(isOpenActionMenuId) === String(destination.id)}
                                                onToggle={() => handleToggleActionMenu(destination.id)}
                                                onClose={handleCloseActionMenu}
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
                    <div className="flex flex-col md:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 bg-gray-50">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>Rows per page:</span>
                            <select
                                className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                                value={pageSize}
                                onChange={(e) => {
                                    const nextSize = Number(e.target.value);
                                    if (activeTab === 'published') {
                                        setPublishedPageSize(nextSize);
                                        setPublishedPage(1);
                                    } else {
                                        setDraftPageSize(nextSize);
                                        setDraftPage(1);
                                    }
                                }}
                            >
                                {pageSizeOptions.map((size) => (
                                    <option key={size} value={size}>{size}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                            <button
                                type="button"
                                className={`px-2 py-1 rounded ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-200'}`}
                                onClick={() => {
                                    if (activeTab === 'published') setPublishedPage(1); else setDraftPage(1);
                                }}
                                disabled={currentPage === 1}
                            >
                                First
                            </button>
                            <button
                                type="button"
                                className={`px-2 py-1 rounded ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-200'}`}
                                onClick={() => {
                                    if (currentPage === 1) return;
                                    if (activeTab === 'published') setPublishedPage(prev => Math.max(1, prev - 1)); else setDraftPage(prev => Math.max(1, prev - 1));
                                }}
                                disabled={currentPage === 1}
                            >
                                Prev
                            </button>
                            {getPageNumbers(currentPage, totalPages).map((pageNum) => (
                                <button
                                    type="button"
                                    key={pageNum}
                                    className={`px-3 py-1 rounded ${pageNum === currentPage ? 'bg-indigo-600 text-white cursor-default' : 'hover:bg-gray-200'}`}
                                    onClick={() => {
                                        if (pageNum === currentPage) return;
                                        if (activeTab === 'published') setPublishedPage(pageNum); else setDraftPage(pageNum);
                                    }}
                                    disabled={pageNum === currentPage}
                                >
                                    {pageNum}
                                </button>
                            ))}
                            <button
                                type="button"
                                className={`px-2 py-1 rounded ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-200'}`}
                                onClick={() => {
                                    if (currentPage === totalPages) return;
                                    if (activeTab === 'published') setPublishedPage(prev => Math.min(totalPages, prev + 1)); else setDraftPage(prev => Math.min(totalPages, prev + 1));
                                }}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </button>
                            <button
                                type="button"
                                className={`px-2 py-1 rounded ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-200'}`}
                                onClick={() => {
                                    if (activeTab === 'published') setPublishedPage(totalPages); else setDraftPage(totalPages);
                                }}
                                disabled={currentPage === totalPages}
                            >
                                Last
                            </button>
                        </div>
                        <div className="text-sm text-gray-600">
                            Page {currentPage} of {totalPages} · {totalCount} items
                        </div>
                    </div>
                </div>
            </div>
        );
    
    // Render form view
    const initialFormState = formDataForForm || emptyDestinationInitialData;

    const importModal = !isImportModalOpen ? null : (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 px-4 py-8">
            <div className="mx-auto max-w-2xl bg-white rounded-xl shadow-xl p-6 space-y-5">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Import destinations via CSV</h2>
                        <p className="text-sm text-gray-500">Uploads to /admin/destination-imports (multipart)</p>
                    </div>
                    <button
                        type="button"
                        onClick={handleCloseImportModal}
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        X
                    </button>
                </div>

                <form className="space-y-4" onSubmit={handleSubmitImport}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CSV file</label>
                        <input
                            type="file"
                            accept=".csv,text/csv"
                            disabled={isUploadingImport}
                            onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                        />
                        <p className="mt-2 text-xs text-gray-500">Use the template headers. Max 500 rows per upload.</p>
                        {importFile && (
                            <p className="mt-1 text-sm text-gray-700">
                                Selected: {importFile.name}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="flex items-center space-x-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                checked={importDryRun}
                                disabled={isUploadingImport}
                                onChange={(e) => setImportDryRun(e.target.checked)}
                            />
                            <span>Dry run (validation only)</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                checked={importAutoSubmit}
                                disabled={isUploadingImport}
                                onChange={(e) => setImportAutoSubmit(e.target.checked)}
                            />
                            <span>Auto-submit drafts</span>
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                        <textarea
                            rows={3}
                            value={importNotes}
                            disabled={isUploadingImport}
                            onChange={(e) => setImportNotes(e.target.value)}
                            placeholder="Add context for reviewers..."
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                        />
                    </div>

                    {lastJobId && (
                        <div className="text-xs text-gray-500">
                            Last job:{' '}
                            <button
                                type="button"
                                className="text-indigo-600 hover:underline"
                                onClick={() => handleOpenJobModal(lastJobId)}
                            >
                                #{lastJobId}
                            </button>
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <button
                            type="button"
                            onClick={handleDownloadTemplate}
                            className="text-sm text-indigo-600 hover:text-indigo-700"
                        >
                            Download template
                        </button>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleCloseImportModal}
                                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isUploadingImport}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60"
                            >
                                {isUploadingImport ? 'Uploading...' : 'Upload CSV'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );

    const statusColors: Record<string, string> = {
        queued: 'bg-amber-100 text-amber-800',
        processing: 'bg-blue-100 text-blue-800',
        completed: 'bg-green-100 text-green-800',
        failed: 'bg-red-100 text-red-800',
    };
    const visibleJobRows = jobRows.slice(0, 6);
    const hasMoreJobRows = jobRows.length > visibleJobRows.length;

    const jobModal = !isJobModalOpen ? null : (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 px-4 py-8">
            <div className="mx-auto max-w-4xl bg-white rounded-xl shadow-xl p-6 space-y-5">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Import job status</h2>
                        <p className="text-sm text-gray-500">Check /admin/destination-imports and download error CSVs.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsJobModalOpen(false)}
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        X
                    </button>
                </div>

                <div className="grid gap-3 md:grid-cols-3 items-start">
                    <div className="md:col-span-2 flex gap-2">
                        <input
                            type="text"
                            value={jobIdInput}
                            onChange={(e) => setJobIdInput(e.target.value)}
                            placeholder="Enter job ID"
                            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => fetchAndSetJob(jobIdInput)}
                            disabled={jobLoading || !jobIdInput.trim()}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60"
                        >
                            {jobLoading ? 'Loading...' : 'Load Job'}
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={handleDownloadErrors}
                        disabled={!jobDetails || (jobDetails.rows_failed ?? 0) === 0 || jobLoading}
                        className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-60"
                    >
                        Download Errors CSV
                    </button>
                </div>

                {jobStatusError && (
                    <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
                        {jobStatusError}
                    </div>
                )}

                {jobDetails && (
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-3 items-center">
                            <span
                                className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                    statusColors[(jobDetails.status ?? '').toLowerCase()] ?? 'bg-gray-100 text-gray-800'
                                }`}
                            >
                                {jobDetails.status ?? 'unknown'}
                            </span>
                            {jobDetails.dry_run && (
                                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
                                    Dry run
                                </span>
                            )}
                            {jobDetails.dry_run === false && (
                                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-50 text-green-700">
                                    Submit on upload
                                </span>
                            )}
                        </div>

                        <div className="grid gap-3 md:grid-cols-3">
                            <div className="p-3 rounded-lg bg-gray-50">
                                <p className="text-xs text-gray-500">Total rows</p>
                                <p className="text-lg font-semibold text-gray-900">{jobDetails.total_rows ?? '—'}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-gray-50">
                                <p className="text-xs text-gray-500">Processed</p>
                                <p className="text-lg font-semibold text-gray-900">{jobDetails.processed_rows ?? '—'}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-gray-50">
                                <p className="text-xs text-gray-500">Failed</p>
                                <p className="text-lg font-semibold text-red-700">{jobDetails.rows_failed ?? 0}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-gray-50">
                                <p className="text-xs text-gray-500">Changes created</p>
                                <p className="text-lg font-semibold text-gray-900">{jobDetails.changes_created ?? '—'}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-gray-50">
                                <p className="text-xs text-gray-500">Pending change IDs</p>
                                <p className="text-lg font-semibold text-gray-900">
                                    {Array.isArray(jobDetails.pending_change_ids) ? jobDetails.pending_change_ids.length : '—'}
                                </p>
                            </div>
                            <div className="p-3 rounded-lg bg-gray-50">
                                <p className="text-xs text-gray-500">Dry run</p>
                                <p className="text-lg font-semibold text-gray-900">
                                    {jobDetails.dry_run === undefined ? '—' : jobDetails.dry_run ? 'Yes' : 'No'}
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="p-3 rounded-lg bg-gray-50">
                                <p className="text-xs text-gray-500">Job ID</p>
                                <p className="text-sm font-mono text-gray-800 break-all">{jobDetails.id}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-gray-50">
                                <p className="text-xs text-gray-500">Uploaded by</p>
                                <p className="text-sm text-gray-800">{jobDetails.uploaded_by || '—'}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-gray-50">
                                <p className="text-xs text-gray-500">Submitted at</p>
                                <p className="text-sm text-gray-800">{jobDetails.submitted_at || jobDetails.created_at || '—'}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-gray-50">
                                <p className="text-xs text-gray-500">Completed at</p>
                                <p className="text-sm text-gray-800">{jobDetails.completed_at || '—'}</p>
                            </div>
                        </div>
                    </div>
                )}

                {jobLoading && !jobDetails && (
                    <p className="text-sm text-gray-500">Loading job...</p>
                )}

                {visibleJobRows.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>Row summary</span>
                            {hasMoreJobRows && (
                                <span>Showing first {visibleJobRows.length} of {jobRows.length}</span>
                            )}
                        </div>
                        <div className="overflow-x-auto border border-gray-200 rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Row #</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Change ID</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Error</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {visibleJobRows.map((row, idx) => (
                                        <tr key={row.id ?? `row-${row.row_number ?? idx}`}>
                                            <td className="px-3 py-2 text-gray-800">{row.row_number ?? '—'}</td>
                                            <td className="px-3 py-2 text-gray-800">{row.status ?? '—'}</td>
                                            <td className="px-3 py-2 text-gray-800 break-all">{row.change_id ?? '—'}</td>
                                            <td className="px-3 py-2 text-gray-600">{row.error ?? '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const overlays = (
        <>
            {importModal}
            {jobModal}
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


    if (viewMode === 'list') {
        return (
            <>
                {listView}
                {overlays}
            </>
        );
    }

    return (
        <>
            <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 px-4 py-8">
                <div className="mx-auto max-w-6xl">
                    <DestinationForm
                        data={initialFormState}
                        viewMode={viewMode as 'add' | 'edit' | 'view'}
                        onChange={handleFormChange}
                        onSave={handleSaveForm}
                        onCancel={handleCancelForm}
                        onDelete={handleFormDelete} 
                        isLoading={isDetailLoading}
                    />
                </div>
            </div>
            {overlays}
        </>
    );
};

export default DestinationManagement;
