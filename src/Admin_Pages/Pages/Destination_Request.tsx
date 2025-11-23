import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownWideNarrow, SlidersHorizontal, CheckCircle2, XCircle } from "lucide-react";
import Dropdown, { type DropdownOption } from "../Admin_Component/Dropdown";
import SearchBar from "../Admin_Component/SearchBar";
import DestinationForm from "../Admin_Component/Destination_Form";
import { emptyDestinationInitialData, type DestinationFormData } from "../Admin_Component/destinationFormData";
import {
  approveDestinationChange,
  fetchDestinationChangeById,
  fetchDestinationChanges,
  rejectDestinationChange,
  type DestinationChange,
  type DestinationChangeDetailResponse,
  type DestinationChangeFields,
} from "../../api";

type RequestStatus = "ADD" | "EDIT" | "DELETE";

interface DestinationRequest {
  id: string;
  destinationId: string;
  destinationName: string;
  type: string;
  createdBy: string;
  adminName: string;
  status: RequestStatus;
}

const requestTypeOptions: DropdownOption[] = [
  { value: "Food", label: "Food" },
  { value: "Culture", label: "Culture" },
  { value: "Nature", label: "Nature" },
  { value: "Sport", label: "Sport" },
] as const;

const requestStatusOptions: DropdownOption[] = [
  { value: "ADD", label: "Add" },
  { value: "EDIT", label: "Edit" },
  { value: "DELETE", label: "Delete" },
] as const;

const sortOptions = [
  { value: "id_asc", label: "Destination ID (Low-High)" },
  { value: "id_desc", label: "Destination ID (High-Low)" },
  { value: "name_asc", label: "Destination Name (A-Z)" },
  { value: "name_desc", label: "Destination Name (Z-A)" },
] as const;

const statusStyles: Record<RequestStatus, string> = {
  ADD: "bg-[#e8f8ef] text-[#1f9c63]",
  EDIT: "bg-[#fff5d8] text-[#b8860b]",
  DELETE: "bg-[#ffe8e8] text-[#c03434]",
};

const toNumberOrNull = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
};

const collectImageSources = (fields?: DestinationChangeFields): string[] => {
  if (!fields) return [];
  const images = new Set<string>();
  const pushIfValid = (candidate?: unknown) => {
    if (typeof candidate === "string") {
      const trimmed = candidate.trim();
      if (trimmed) {
        images.add(trimmed);
      }
    }
  };

  pushIfValid(fields.hero_image_url);
  pushIfValid(fields.published_hero_image);

  if (Array.isArray(fields.gallery)) {
    fields.gallery.forEach((item) => {
      if (item && typeof item === "object" && "url" in item) {
        pushIfValid(item.url);
      }
    });
  }

  return Array.from(images);
};

const mapChangeDetailToFormData = (
  change: DestinationChangeDetailResponse["change_request"]
): DestinationFormData => {
  const fields = change.fields ?? {};
  const base = { ...emptyDestinationInitialData };

  return {
    ...base,
    id: change.destination_id ?? change.id ?? base.id,
    name: typeof fields.name === "string" ? fields.name : base.name,
    type: typeof fields.category === "string" ? fields.category : base.type,
    contact: typeof fields.contact === "string" ? fields.contact : base.contact,
    country: typeof fields.country === "string" ? fields.country : base.country,
    city: typeof fields.city === "string" ? fields.city : base.city,
    latitude: toNumberOrNull(fields.latitude) ?? base.latitude,
    longitude: toNumberOrNull(fields.longitude) ?? base.longitude,
    openingTime: typeof fields.opening_time === "string" ? fields.opening_time : base.openingTime,
    closingTime: typeof fields.closing_time === "string" ? fields.closing_time : base.closingTime,
    description: typeof fields.description === "string" ? fields.description : base.description,
    images: collectImageSources(fields),
    imageFiles: [],
  };
};

const DestinationRequestPage = () => {
  const [requests, setRequests] = useState<DestinationRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<(typeof sortOptions)[number]["value"]>("id_asc");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState<RequestStatus | "">("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [lastActionMessage, setLastActionMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isRejectWarningOpen, setIsRejectWarningOpen] = useState(false);
  const [rejectMessage, setRejectMessage] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [detailFormData, setDetailFormData] = useState<DestinationFormData | null>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const mapActionToStatus = (action: string): RequestStatus => {
    switch (action) {
      case "create":
        return "ADD";
      case "delete":
        return "DELETE";
      case "update":
      case "edit":
      default:
        return "EDIT";
    }
  };

  const mapChangeToRequest = (change: DestinationChange): DestinationRequest => ({
    id: change.id,
    destinationId: change.destination_id ?? change.id ?? "—",
    destinationName: change.fields?.name ?? "Untitled destination",
    type: (change.fields?.category as string) ?? (change.fields?.status as string) ?? "Unknown",
    createdBy: change.submitted_by ?? "Unknown",
    adminName: change.reviewed_by ?? "Pending",
    status: mapActionToStatus(change.action),
  });

  const loadRequests = useCallback(
    async (destinationId?: string) => {
      setIsLoading(true);
      setApiError(null);
      try {
        const response = await fetchDestinationChanges({
          status: "pending_review",
          limit: 50,
          offset: 0,
          destination_id: destinationId,
        });
        setRequests(response.changes.map(mapChangeToRequest));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load destination requests.";
        setApiError(message);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const loadRequestDetails = useCallback(async (requestId: string) => {
    if (!requestId) return;
    setActiveRequestId(requestId);
    setIsDetailLoading(true);
    setDetailError(null);
    setDetailFormData(null);
    try {
      const detail = await fetchDestinationChangeById(requestId);
      setDetailFormData(mapChangeDetailToFormData(detail.change_request));
      setIsDetailViewOpen(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load destination request details.";
      setDetailError(message);
      setIsDetailViewOpen(false);
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const filteredRequests = useMemo(() => {
    let result = [...requests];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (request) =>
          request.destinationName.toLowerCase().includes(term) ||
          request.destinationId.toLowerCase().includes(term)
      );
    }

    if (filterType) {
      result = result.filter((request) => request.type === filterType);
    }

    if (filterStatus) {
      result = result.filter((request) => request.status === filterStatus);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "id_desc":
          return b.destinationId.localeCompare(a.destinationId);
        case "name_asc":
          return a.destinationName.localeCompare(b.destinationName);
        case "name_desc":
          return b.destinationName.localeCompare(a.destinationName);
        case "id_asc":
        default:
          return a.destinationId.localeCompare(b.destinationId);
      }
    });

    return result;
  }, [requests, searchTerm, sortBy, filterType, filterStatus]);

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => filteredRequests.some((request) => request.id === id)));
  }, [filteredRequests]);

  useEffect(() => {
    if (!activeRequestId) {
      return;
    }
    const stillExists = requests.some((request) => request.id === activeRequestId);
    if (!stillExists) {
      setActiveRequestId(null);
      setIsDetailViewOpen(false);
      setDetailFormData(null);
    }
  }, [activeRequestId, requests]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isSortOpen && sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
      if (isFilterOpen && filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSortOpen, isFilterOpen]);

  const isAllSelected = filteredRequests.length > 0 && filteredRequests.every((request) => selectedIds.includes(request.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRequests.map((request) => request.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((requestId) => requestId !== id) : [...prev, id]
    );
  };

  const handleSearch = () => {
    setLastActionMessage(
      searchTerm.trim()
        ? `Showing results for “${searchTerm.trim()}”.`
        : "Showing all destination requests."
    );
  };

  const handleCloseDetailView = () => {
    setIsDetailViewOpen(false);
    setDetailFormData(null);
    setActiveRequestId(null);
  };

  const handleApprove = async () => {
    if (!selectedIds.length) {
      setLastActionMessage("Select at least one request to approve.");
      return;
    }
    setIsApproving(true);
    setActionError(null);
    try {
      for (const requestId of selectedIds) {
        await approveDestinationChange(requestId);
      }
      setLastActionMessage(`Approved ${selectedIds.length} request${selectedIds.length > 1 ? "s" : ""}.`);
      setSelectedIds([]);
      await loadRequests();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to approve the selected requests. Please try again.";
      setActionError(message);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = () => {
    if (!selectedIds.length) {
      setLastActionMessage("Select at least one request to reject.");
      return;
    }
    if (selectedIds.length > 1) {
      const message = "You can only reject one request at a time.";
      setLastActionMessage(message);
      setActionError(message);
      setIsRejectWarningOpen(true);
      return;
    }
    setRejectMessage("");
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectMessage.trim()) {
      setActionError("Please provide a rejection reason.");
      return;
    }
    const requestId = selectedIds[0];
    if (!requestId) return;

    setIsRejecting(true);
    setActionError(null);
    try {
      await rejectDestinationChange(requestId, rejectMessage.trim());
      setLastActionMessage("Request rejected successfully.");
      setSelectedIds([]);
      setIsRejectModalOpen(false);
      setRejectMessage("");
      await loadRequests();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to reject the request. Please try again.";
      setActionError(message);
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <>
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Destination Request</h1>

      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div className="flex-1 min-w-[260px]">
          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onSearch={handleSearch}
            placeholder="Find Destination Request"
          />
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <div className="flex items-center gap-3">
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
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-xl bg-white ring-1 ring-gray-200 z-10 p-2">
                  {sortOptions.map((option) => (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setIsSortOpen(false);
                      }}
                      className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        sortBy === option.value ? "bg-indigo-500 text-white" : "text-gray-700 hover:bg-gray-100"
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
                Filter
              </button>
              {isFilterOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-md shadow-xl bg-white ring-1 ring-gray-200 z-10 p-4 space-y-3">
                  <div className="border-b pb-3">
                    <p className="text-xs font-semibold text-gray-500 mb-1">Filter by Type</p>
                    <Dropdown
                      name="requestType"
                      value={filterType}
                      options={requestTypeOptions}
                      onChange={setFilterType}
                      placeholder="All Types"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Filter by Status</p>
                    <Dropdown
                      name="requestStatus"
                      value={filterStatus}
                      options={requestStatusOptions}
                      onChange={(value) => setFilterStatus(value as RequestStatus)}
                      placeholder="All Statuses"
                      className="w-full"
                    />
                  </div>

                  <div className="flex justify-end pt-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFilterType("");
                        setFilterStatus("");
                      }}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFilterOpen(false)}
                      className="text-xs px-4 py-1 rounded-md bg-indigo-600 text-white"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleApprove}
                disabled={!selectedIds.length || isApproving}
                className="flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {isApproving ? "Approving..." : "Approve"}
              </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={!selectedIds.length}
              className="flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-rose-500 hover:bg-rose-600 shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </button>
          </div>
        </div>
      </div>

      {[actionError, apiError, detailError].map(
        (message, index) =>
          message && (
            <div
              key={`${message}-${index}`}
              className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700"
            >
              {message}
            </div>
          )
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm text-gray-700">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold tracking-wider">
            <tr>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Destination ID</th>
              <th className="px-6 py-3 text-left">Destination Name</th>
              <th className="px-6 py-3 text-left">Type</th>
              <th className="px-6 py-3 text-left">Created By</th>
              <th className="px-6 py-3 text-left">Admin Name</th>
              <th className="px-6 py-3 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 accent-indigo-600"
                />
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                  Loading destination requests...
                </td>
              </tr>
            ) : filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                  No destination requests found.
                </td>
              </tr>
            ) : (
              filteredRequests.map((request, index) => (
                <tr
                  key={`${request.id}-${index}`}
                  onClick={() => {
                    void loadRequestDetails(request.id);
                  }}
                  className={`transition-colors cursor-pointer ${
                    activeRequestId === request.id ? "bg-indigo-50" : "hover:bg-gray-50"
                  }`}
                  aria-selected={activeRequestId === request.id}
                >
                  <td className="px-6 py-4">
                    <span
                      className={`px-4 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${statusStyles[request.status]}`}
                    >
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.destinationId}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{request.destinationName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.createdBy}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.adminName}</td>
                  <td className="px-6 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(request.id)}
                      onChange={(event) => {
                        event.stopPropagation();
                        toggleSelectOne(request.id);
                      }}
                      className="w-4 h-4 accent-indigo-600"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {lastActionMessage && (
        <div className="text-right text-xs text-gray-500 mt-2">{lastActionMessage}</div>
      )}
    </div>

    {isDetailLoading && (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20">
        <div className="rounded-lg bg-white px-4 py-3 text-sm text-gray-700 shadow">Loading request details...</div>
      </div>
    )}

    {isDetailViewOpen && detailFormData && (
      <div className="fixed inset-0 z-40 overflow-y-auto bg-black/40 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <DestinationForm
            data={detailFormData}
            viewMode="view"
            onChange={setDetailFormData}
            onSave={() => undefined}
            onCancel={handleCloseDetailView}
          />
        </div>
      </div>
    )}

    {isRejectWarningOpen && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Reject Limit</h2>
          <p className="text-sm text-gray-600">
            You can only reject one destination request at a time. Please select a single request and try again.
          </p>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setIsRejectWarningOpen(false)}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white shadow hover:bg-indigo-700"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    )}

    {isRejectModalOpen && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Reject Destination Request</h2>
          <p className="text-sm text-gray-600">
            Please provide a short explanation for rejecting this destination request.
          </p>
          <textarea
            value={rejectMessage}
            onChange={(event) => setRejectMessage(event.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-xl p-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-400"
            placeholder="Reason for rejection..."
          />
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setIsRejectModalOpen(false);
                setRejectMessage("");
              }}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100"
              disabled={isRejecting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmReject}
              disabled={isRejecting}
              className="px-4 py-2 rounded-lg bg-rose-500 text-white shadow hover:bg-rose-600 disabled:opacity-50"
            >
              {isRejecting ? "Rejecting..." : "Confirm Reject"}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default DestinationRequestPage;
