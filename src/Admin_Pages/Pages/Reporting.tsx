import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownWideNarrow, SlidersHorizontal, BarChart3, Loader2 } from 'lucide-react';

import SearchBar from '../Admin_Component/SearchBar';
import DestinationForm from '../Admin_Component/Destination_Form';
import { emptyDestinationInitialData, type DestinationFormData } from '../Admin_Component/destinationFormData';
import {
    exportDestinationStats,
    fetchDestinationStatsViews,
    fetchPublishedDestinations,
    type DestinationChangeFields,
    type DestinationStatsViewsResponse,
} from '../../api';
import type { Destination as TravelerDestination } from '../../types/destination';

interface ReportingDestination {
    id: string;
    name: string;
    type: string;
    country?: string;
    city?: string;
    status?: string;
    details: DestinationChangeFields;
    record: TravelerDestination;
}

const typeOptions = [
    { value: 'Culture', label: 'Culture' },
    { value: 'Food', label: 'Food' },
    { value: 'Nature', label: 'Nature' },
    { value: 'Sport', label: 'Sport' },
] as const;

const sortOptions = [
    { value: 'id_low', label: 'ID (Low to High)' },
    { value: 'id_high', label: 'ID (High to Low)' },
    { value: 'name_asc', label: 'Name (A-Z)' },
    { value: 'name_desc', label: 'Name (Z-A)' },
] as const;

const statsRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: '30d', label: '30 Days' },
    { value: '7d', label: '7 Days' },
    { value: '24h', label: '24 Hours' },
    { value: '6h', label: '6 Hours' },
    { value: '1h', label: '1 Hour' },
] as const;

type StatsRangeValue = typeof statsRangeOptions[number]['value'];

const collectImagesFromDestination = (destination: ReportingDestination): string[] => {
    const images = new Set<string>();
    const details = destination.details ?? {};
    const pushIfString = (value?: unknown) => {
        if (typeof value === 'string' && value.trim()) {
            images.add(value.trim());
        }
    };

    pushIfString(details.hero_image_url);
    if (Array.isArray(details.gallery)) {
        details.gallery.forEach((item) => pushIfString(item?.url));
    }

    if (images.size === 0) {
        pushIfString(destination.record.hero_image_url);
        if (Array.isArray(destination.record.gallery)) {
            destination.record.gallery.forEach((item) => pushIfString(item?.url));
        }
    }

    return Array.from(images);
};

const mapDestinationToFormData = (destination: ReportingDestination): DestinationFormData => {
    const fields = destination.details ?? {};
    return {
        ...emptyDestinationInitialData,
        id: destination.id,
        name: typeof fields.name === 'string' ? fields.name : destination.record.name ?? '',
        type: typeof fields.category === 'string' ? fields.category : destination.record.category ?? '',
        contact: typeof fields.contact === 'string' ? fields.contact : destination.record.contact ?? '',
        country: typeof fields.country === 'string' ? fields.country : destination.record.country ?? '',
        city: typeof fields.city === 'string' ? fields.city : destination.record.city ?? '',
        latitude: typeof fields.latitude === 'number' ? fields.latitude : destination.record.latitude ?? null,
        longitude: typeof fields.longitude === 'number' ? fields.longitude : destination.record.longitude ?? null,
        openingTime: typeof fields.opening_time === 'string' ? fields.opening_time : destination.record.opening_time ?? emptyDestinationInitialData.openingTime,
        closingTime: typeof fields.closing_time === 'string' ? fields.closing_time : destination.record.closing_time ?? emptyDestinationInitialData.closingTime,
        description: typeof fields.description === 'string' ? fields.description : destination.record.description ?? '',
        images: collectImagesFromDestination(destination),
        imageFiles: [],
    };
};

const adaptPublishedRecordToDestination = (record: TravelerDestination): ReportingDestination => {
    const details: DestinationChangeFields = {
        name: record.name,
        category: record.category,
        status: record.status,
        city: record.city,
        country: record.country,
        description: record.description,
        contact: record.contact,
        opening_time: record.opening_time,
        closing_time: record.closing_time,
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
        name: record.name ?? '—',
        type: record.category ?? '—',
        country: record.country ?? '—',
        city: record.city ?? '—',
        status: record.status ?? 'active',
        details,
        record,
    };
};

const ReportingPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<typeof sortOptions[number]['value']>('name_asc');
    const [filterType, setFilterType] = useState<string>('');
    const [destinations, setDestinations] = useState<ReportingDestination[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedDestination, setSelectedDestination] = useState<ReportingDestination | null>(null);
    const [formData, setFormData] = useState<DestinationFormData>(emptyDestinationInitialData);
    const [statsRange, setStatsRange] = useState<StatsRangeValue>('all');
    const [statsData, setStatsData] = useState<DestinationStatsViewsResponse | null>(null);
    const [isStatsLoading, setIsStatsLoading] = useState(false);
    const [statsError, setStatsError] = useState<string | null>(null);

    const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const sortRef = useRef<HTMLDivElement>(null);
    const filterRef = useRef<HTMLDivElement>(null);
    const pageSizeOptions = [25, 50, 100, 200];

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
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        let isCancelled = false;
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetchPublishedDestinations({
                    limit: pageSize,
                    offset: (page - 1) * pageSize,
                    query: searchTerm.trim() || undefined,
                    categories: filterType || undefined,
                });
                if (!isCancelled) {
                    const mapped = response.destinations.map(adaptPublishedRecordToDestination);
                    setDestinations(mapped);
                    const meta = response.meta ?? {} as Record<string, unknown>;
                    const totalCount = (meta as { total?: number; count?: number }).total ?? (meta as { total?: number; count?: number }).count ?? response.destinations.length ?? 0;
                    setTotal(totalCount);
                }
            } catch (err) {
                if (!isCancelled) {
                    setError(err instanceof Error ? err.message : 'Unable to load destinations');
                    setDestinations([]);
                    setTotal(0);
                }
            } finally {
                if (!isCancelled) {
                    setIsLoading(false);
                }
            }
        };

        fetchData();
        return () => {
            isCancelled = true;
        };
    }, [page, pageSize, searchTerm, filterType]);

    useEffect(() => {
        if (!selectedDestination) {
            setStatsData(null);
            return;
        }
        let isCancelled = false;
        const loadStats = async () => {
            setIsStatsLoading(true);
            setStatsError(null);
            try {
                const response = await fetchDestinationStatsViews({
                    destination_id: selectedDestination.id,
                    range: statsRange === 'all' ? undefined : statsRange,
                });
                if (!isCancelled) {
                    setStatsData(response);
                }
            } catch (err) {
                if (!isCancelled) {
                    setStatsError(err instanceof Error ? err.message : 'Unable to load statistics');
                    setStatsData(null);
                }
            } finally {
                if (!isCancelled) {
                    setIsStatsLoading(false);
                }
            }
        };

        loadStats();
        return () => {
            isCancelled = true;
        };
    }, [selectedDestination, statsRange]);

    const processedDestinations = useMemo(() => {
        let result = [...destinations];
        result.sort((a, b) => {
            switch (sortBy) {
                case 'name_asc':
                    return a.name.localeCompare(b.name);
                case 'name_desc':
                    return b.name.localeCompare(a.name);
                case 'id_low':
                    return a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' });
                case 'id_high':
                    return b.id.localeCompare(a.id, undefined, { numeric: true, sensitivity: 'base' });
                default:
                    return 0;
            }
        });

        return result;
    }, [destinations, searchTerm, filterType, sortBy]);

    const handleReportStat = (destination: ReportingDestination) => {
        setSelectedDestination(destination);
        setFormData(mapDestinationToFormData(destination));
        setViewMode('detail');
        setStatsRange('all');
    };

    const handleExportStats = async () => {
        if (!selectedDestination) return;
        try {
            const csvText = await exportDestinationStats([selectedDestination.id]);
            const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${selectedDestination.name.replace(/\s+/g, '-').toLowerCase()}-stats.csv`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            setStatsError(err instanceof Error ? err.message : 'Unable to export statistics');
        }
    };

    const handleBackToList = () => {
        setViewMode('list');
        setSelectedDestination(null);
        setFormData(emptyDestinationInitialData);
        setStatsData(null);
        setStatsError(null);
    };

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const getPageNumbers = (current: number, totalPagesValue: number): number[] => {
        if (totalPagesValue <= 5) return Array.from({ length: totalPagesValue }, (_, i) => i + 1);
        if (current <= 3) return [1, 2, 3, 4, 5];
        if (current >= totalPagesValue - 2) return [totalPagesValue - 4, totalPagesValue - 3, totalPagesValue - 2, totalPagesValue - 1, totalPagesValue];
        return [current - 2, current - 1, current, current + 1, current + 2];
    };

    const handleSearch = () => {
        setPage(1);
    };

    const listView = (
        <div className="p-8 space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Reporting &amp; Statistics</h1>
                    <p className="text-gray-500 mt-1">Export usage statistics for any published destination.</p>
                </div>
                <SearchBar
                    searchTerm={searchTerm}
                    setSearchTerm={(val) => { setSearchTerm(val); setPage(1); }}
                    onSearch={handleSearch}
                    placeholder="Search destination by name or ID..."
                />
            </div>

            <div className="flex flex-wrap gap-3 items-center">
                <div className="relative" ref={sortRef}>
                    <button
                        type="button"
                        onClick={() => setIsSortOpen((prev) => !prev)}
                        className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm text-sm"
                    >
                        <ArrowDownWideNarrow className="w-4 h-4 mr-2" />
                        Sort By
                    </button>
                    {isSortOpen && (
                        <div className="absolute mt-2 w-48 rounded-md shadow-xl bg-white ring-1 ring-gray-200 z-10 p-2">
                            {sortOptions.map((option) => (
                                <button
                                    type="button"
                                    key={option.value}
                                    onClick={() => {
                                        setSortBy(option.value);
                                        setIsSortOpen(false);
                                    }}
                                    className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                        sortBy === option.value ? 'bg-indigo-500 text-white' : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="relative" ref={filterRef}>
                    <button
                        type="button"
                        onClick={() => setIsFilterOpen((prev) => !prev)}
                        className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm text-sm"
                    >
                        <SlidersHorizontal className="w-4 h-4 mr-2" />
                        Filter Type
                    </button>
                    {isFilterOpen && (
                        <div className="absolute mt-2 w-48 rounded-md shadow-xl bg-white ring-1 ring-gray-200 z-10 p-2">
                            <div className="flex items-center justify-between px-3 py-2 text-xs text-gray-500 uppercase tracking-wide">
                                <span>Filter Type</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFilterType('');
                                        setIsFilterOpen(false);
                                    }}
                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                                >
                                    Clear
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setFilterType('');
                                    setIsFilterOpen(false);
                                }}
                                className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                    filterType === '' ? 'bg-indigo-500 text-white' : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                All Types
                            </button>
                            {typeOptions.map((option) => (
                                <button
                                    type="button"
                                    key={option.value}
                                    onClick={() => {
                                        setFilterType(option.value);
                                        setIsFilterOpen(false);
                                    }}
                                    className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                        filterType === option.value ? 'bg-indigo-500 text-white' : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <tr>
                            <th className="px-6 py-3 text-left">Destination ID</th>
                            <th className="px-6 py-3 text-left">Name</th>
                            <th className="px-6 py-3 text-left">Type</th>
                            <th className="px-6 py-3 text-left">Country</th>
                            <th className="px-6 py-3 text-left">City</th>
                            <th className="px-6 py-3 text-left">Status</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-sm">
                        {isLoading && (
                            <tr>
                                <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                                    Loading destinations...
                                </td>
                            </tr>
                        )}
                        {!isLoading && error && (
                            <tr>
                                <td colSpan={7} className="px-6 py-10 text-center text-red-500">
                                    {error}
                                </td>
                            </tr>
                        )}
                        {!isLoading && !error && processedDestinations.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                                    No destinations match your filters. Try adjusting the search criteria.
                                </td>
                            </tr>
                        )}
                        {!isLoading &&
                            !error &&
                            processedDestinations.map((destination) => (
                                <tr key={destination.id}>
                                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{destination.id}</td>
                                    <td className="px-6 py-4 text-gray-800 font-semibold">{destination.name}</td>
                                    <td className="px-6 py-4 text-gray-600">{destination.type}</td>
                                    <td className="px-6 py-4 text-gray-600">{destination.country}</td>
                                    <td className="px-6 py-4 text-gray-600">{destination.city}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                                            {destination.status ?? 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            type="button"
                                            onClick={() => handleReportStat(destination)}
                                            className="inline-flex items-center px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                        >
                                            <BarChart3 className="w-4 h-4 mr-2" />
                                            Report Stat
                                        </button>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
                <div className="flex flex-col md:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>Rows per page:</span>
                        <select
                            className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setPage(1);
                            }}
                        >
                            {pageSizeOptions.map((size) => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                        <button
                            type="button"
                            className={`px-2 py-1 rounded ${page === 1 ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-200'}`}
                            onClick={() => setPage(1)}
                            disabled={page === 1}
                        >
                            First
                        </button>
                        <button
                            type="button"
                            className={`px-2 py-1 rounded ${page === 1 ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-200'}`}
                            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                            disabled={page === 1}
                        >
                            Prev
                        </button>
                        {getPageNumbers(page, totalPages).map((num) => (
                            <button
                                type="button"
                                key={num}
                                className={`px-3 py-1 rounded ${num === page ? 'bg-indigo-600 text-white cursor-default' : 'hover:bg-gray-200'}`}
                                onClick={() => setPage(num)}
                                disabled={num === page}
                            >
                                {num}
                            </button>
                        ))}
                        <button
                            type="button"
                            className={`px-2 py-1 rounded ${page === totalPages ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-200'}`}
                            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={page === totalPages}
                        >
                            Next
                        </button>
                        <button
                            type="button"
                            className={`px-2 py-1 rounded ${page === totalPages ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-200'}`}
                            onClick={() => setPage(totalPages)}
                            disabled={page === totalPages}
                        >
                            Last
                        </button>
                    </div>
                    <div className="text-sm text-gray-600">
                        Page {page} of {totalPages} · {total} items
                    </div>
                </div>
            </div>
        </div>
    );

    const detailView = selectedDestination && (
        <div className="p-8 space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Destination Report</h1>
                    <p className="text-gray-500 mt-1">
                        Review information for <span className="font-semibold text-gray-800">{selectedDestination.name}</span> and export
                        usage statistics.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={handleExportStats}
                        className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Export CSV
                    </button>
                    <button
                        type="button"
                        onClick={handleBackToList}
                        className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Back to Reporting
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6 space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Latest Statistics</h2>
                    <div className="flex items-center gap-2">
                        <label htmlFor="statsRange" className="text-sm text-gray-500">
                            Time Range:
                        </label>
                        <select
                            id="statsRange"
                            value={statsRange}
                            onChange={(e) => setStatsRange(e.target.value as StatsRangeValue)}
                            className="border border-gray-300 rounded-md text-sm px-2 py-1 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            {statsRangeOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                {isStatsLoading && (
                    <div className="flex items-center gap-2 text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading statistics...
                    </div>
                )}
                {!isStatsLoading && statsError && <p className="text-sm text-red-600">{statsError}</p>}
                {!isStatsLoading && !statsError && statsData && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg border border-gray-100 bg-gray-50">
                            <p className="text-sm text-gray-500">Total Views</p>
                            <p className="text-2xl font-bold text-gray-900">{statsData.views?.total_views ?? '—'}</p>
                        </div>
                        <div className="p-4 rounded-lg border border-gray-100 bg-gray-50">
                            <p className="text-sm text-gray-500">Unique Users</p>
                            <p className="text-2xl font-bold text-gray-900">{statsData.views?.unique_users ?? '—'}</p>
                        </div>
                        <div className="p-4 rounded-lg border border-gray-100 bg-gray-50">
                            <p className="text-sm text-gray-500">Unique IPs</p>
                            <p className="text-2xl font-bold text-gray-900">{statsData.views?.unique_ips ?? '—'}</p>
                        </div>
                    </div>
                )}
                {!isStatsLoading && !statsError && !statsData && (
                    <p className="text-sm text-gray-500">No statistics available for this destination.</p>
                )}
                {statsData?.views?.last_updated_at && (
                    <p className="text-xs text-gray-400">Last updated: {new Date(statsData.views.last_updated_at).toLocaleString()}</p>
                )}
            </div>

            <div className="bg-white rounded-xl shadow p-6">
                <DestinationForm
                    data={formData}
                    viewMode="view"
                    onChange={setFormData}
                    onSave={() => undefined}
                    onCancel={handleBackToList}
                    isLoading={false}
                    hideExitButton
                />
            </div>
        </div>
    );

    return viewMode === 'detail' && selectedDestination ? detailView : listView;
};

export default ReportingPage;
