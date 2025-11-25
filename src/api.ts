import { API_BASE_URL } from "./config";
import {
  getExpiresAt,
  getToken,
  logout,
  setAuthSession,
  type AuthSession,
  type AuthUser,
} from "./services/auth/authService";
import type { DestinationByIdPayload, DestinationReviewsPayload, DestinationsResponse } from "./types/destination";

const handleUnauthorized = () => {
  logout();
  window.location.href = '/';
};

const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("token");
  if (!token) {
    handleUnauthorized();
    throw new Error("No token provided");
  }

  const isFormData = options.body instanceof FormData;

  const headers = new Headers(options.headers ?? undefined);

  if (isFormData) {
    headers.delete("Content-Type");
  } else if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  headers.set("Authorization", `Bearer ${token}`);

  try {
    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 401) {
      handleUnauthorized();
      throw new Error("Session expired");
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[DEBUG] API Error Response:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(errorText || `Request failed with status ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error("[DEBUG] Network Error:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Network error");
  }
};

export async function register(email: string, password: string): Promise<AuthSession> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Registration failed");
  }

  const data = (await res.json()) as AuthSession;

  setAuthSession(data);

  return data;
}

export const login = async (email: string, password: string): Promise<AuthSession> => {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Login failed");
  }
  const data = (await res.json()) as AuthSession;
  setAuthSession(data);

  return data;
};

export const loginWithGoogle = async (idToken: string): Promise<AuthSession> => {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_token: idToken }),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Google login failed");
  }

  const data = (await res.json()) as AuthSession;
  setAuthSession(data);

  return data;
};

const parseErrorMessage = (payload: string): string => {
  if (!payload) {
    return "Unexpected error";
  }
  try {
    const data = JSON.parse(payload) as { error?: string; message?: string };
    if (data?.error) {
      return data.error;
    }
    if (data?.message) {
      return data.message;
    }
  } catch {
    // ignore JSON parse errors
  }
  return payload;
};

export async function requestPasswordReset(email: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/password/reset-request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(parseErrorMessage(msg) || "Unable to initiate password reset");
  }
}

export async function confirmPasswordReset(email: string, otp: string, newPassword: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/password/reset-confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp, new_password: newPassword }),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(parseErrorMessage(msg) || "Unable to reset password");
  }
}

export async function getDestinationById(id: string): Promise<DestinationByIdPayload> {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/v1/destinations/${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Unable to fetch destination details");
  }

  return (await res.json()) as DestinationByIdPayload;
}

export async function getDestinationReviewById(id: string): Promise<DestinationReviewsPayload> {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/v1/destinations/${id}/reviews`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Unable to fetch destination reviews");
  }

  return (await res.json()) as DestinationReviewsPayload;
}

export interface DestinationStatsViewsResponse {
  destination_id: string;
  name?: string;
  city?: string;
  country?: string;
  views?: {
    last_updated_at?: string;
    total_views?: number;
    unique_ips?: number;
    unique_users?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface DestinationStatsViewsQuery {
  destination_id: string;
  range?: "1h" | "6h" | "12h" | "24h" | "7d" | "30d" | "all";
}

export async function fetchDestinationStatsViews({
  destination_id,
  range,
}: DestinationStatsViewsQuery): Promise<DestinationStatsViewsResponse> {
  const searchParams = new URLSearchParams({ destination_id });
  if (range && range !== "all") {
    searchParams.set("range", range);
  }

  const response = await fetchWithAuth(
    `${API_BASE_URL}/api/v1/admin/destination-stats/views?${searchParams.toString()}`,
    {
      method: "GET",
    }
  );

  return (await response.json()) as DestinationStatsViewsResponse;
}

export async function exportDestinationStats(destinationIds?: string[]): Promise<string> {
  const body =
    Array.isArray(destinationIds) && destinationIds.length > 0
      ? { destination_ids: destinationIds }
      : {};

  const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/admin/destination-stats/export`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  return await response.text();
}

export interface PublishedDestinationsQuery {
  limit?: number;
  offset?: number;
  query?: string;
  categories?: string;
  min_rating?: number;
  max_rating?: number;
}

export async function fetchPublishedDestinations(
  query: PublishedDestinationsQuery = {}
): Promise<DestinationsResponse> {
  const params = new URLSearchParams();
  if (typeof query.limit === "number") params.set("limit", String(query.limit));
  if (typeof query.offset === "number") params.set("offset", String(query.offset));
  if (query.query) params.set("query", query.query);
  if (query.categories) params.set("categories", query.categories);
  if (typeof query.min_rating === "number") params.set("min_rating", String(query.min_rating));
  if (typeof query.max_rating === "number") params.set("max_rating", String(query.max_rating));

  const queryString = params.toString();
  const url = `${API_BASE_URL}/api/v1/destinations${queryString ? `?${queryString}` : ""}`;
  const response = await fetchWithAuth(url, { method: "GET" });
  return (await response.json()) as DestinationsResponse;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/v1/auth/password`, {
    method: "POST",
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(parseErrorMessage(msg) || "Unable to change password");
  }
}

const isLikelyAuthUser = (value: unknown): value is AuthUser => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    "email" in candidate ||
    "id" in candidate ||
    "full_name" in candidate ||
    "fullName" in candidate ||
    "name" in candidate
  );
};

const resolveAuthUser = (value: unknown): AuthUser | undefined => {
  if (isLikelyAuthUser(value)) {
    return value as AuthUser;
  }

  if (!value || typeof value !== "object") {
    return undefined;
  }

  if ("user" in value) {
    const nested = (value as { user?: unknown }).user;
    if (nested && typeof nested === "object") {
      return nested as AuthUser;
    }
  }

  if ("body" in value) {
    return resolveAuthUser((value as { body?: unknown }).body);
  }

  if ("data" in value) {
    return resolveAuthUser((value as { data?: unknown }).data);
  }

  return undefined;
};

export async function fetchCurrentUser(): Promise<AuthUser> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/auth/me`, {
    method: "GET",
  });

  const raw = (await response.json()) as unknown;

  const user = resolveAuthUser(raw);

  if (!user) {
    throw new Error("Malformed /auth/me response: missing user data");
  }

  const token = getToken();
  if (!token) {
    throw new Error("Authentication token missing after /auth/me call");
  }

  const expiresAt = getExpiresAt() ?? undefined;
  setAuthSession({ token, user, expires_at: expiresAt });

  return user;
}

export interface UpdateProfilePayload {
  full_name?: string;
  username?: string;
  avatar?: Blob | File | null;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<AuthUser> {
  const formData = new FormData();

  if (payload.full_name !== undefined) {
    formData.append("full_name", payload.full_name);
  }

  if (payload.username !== undefined) {
    formData.append("username", payload.username);
  }

  if (payload.avatar) {
    formData.append("avatar", payload.avatar);
  }

  const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/auth/profile`, {
    method: "POST",
    body: formData,
  });

  const raw = (await response.json()) as unknown;
  const user = resolveAuthUser(raw);

  if (!user) {
    throw new Error("Malformed profile update response: missing user data");
  }

  const token = getToken();
  if (!token) {
    throw new Error("Authentication token missing after profile update");
  }

  const expiresAt = getExpiresAt() ?? undefined;
  setAuthSession({ token, user, expires_at: expiresAt });

  return user;
}

export async function deleteUserAccount(userId: string): Promise<void> {
  await fetchWithAuth(`${API_BASE_URL}/api/v1/auth/users/${userId}`, {
    method: "DELETE",
  });
}

export interface DestinationChangeFields {
  name?: string;
  category?: string;
  status?: string;
  city?: string;
  country?: string;
  description?: string;
  slug?: string;
  opening_time?: string;
  closing_time?: string;
  contact?: string;
  latitude?: number;
  longitude?: number;
  gallery?: Array<{
    caption?: string;
    ordering?: number;
    url?: string;
  }>;
  hero_image_temp_key?: string;
  hero_image_upload_id?: string;
  hero_image_url?: string;
  published_hero_image?: string;
  hard_delete?: boolean;
  [key: string]: unknown;
}

export interface DestinationChange {
  id: string;
  action: string;
  destination_id?: string;
  status?: string;
  submitted_by?: string;
  submitted_by_full_name?: string;
  submitted_by_username?: string;
  reviewed_by?: string;
  reviewed_by_full_name?: string;
  reviewed_by_username?: string;
  submitted_at?: string;
  reviewed_at?: string;
  draft_version?: number;
  published_version?: number;
  review_message?: string;
  hero_image_temp_key?: string;
  hero_image_upload_id?: string;
  created_at?: string;
  updated_at?: string;
  fields?: DestinationChangeFields;
}

export interface DestinationChangesResponse {
  changes: DestinationChange[];
  meta: {
    count: number;
    limit: number;
    offset: number;
  };
}

export interface DestinationChangeQuery {
  status?: string;
  destination_id?: string;
  limit?: number;
  offset?: number;
}

export interface DestinationChangeDetailResponse {
  change_request: DestinationChange & {
    draft_version?: number;
    published_version?: number;
    review_message?: string;
    submitted_at?: string;
    submitted_by?: string;
    hero_image_temp_key?: string;
    hero_image_upload_id?: string;
  };
}

export async function fetchDestinationChanges(
  query: DestinationChangeQuery = {}
): Promise<DestinationChangesResponse> {
  const params = new URLSearchParams();

  if (query.status) params.set("status", query.status);
  if (query.destination_id) params.set("destination_id", query.destination_id);
  if (typeof query.limit === "number") params.set("limit", String(query.limit));
  if (typeof query.offset === "number") params.set("offset", String(query.offset));

  const queryString = params.toString();
  const url = `${API_BASE_URL}/api/v1/admin/destination-changes${queryString ? `?${queryString}` : ""}`;

  const response = await fetchWithAuth(url, { method: "GET" });
  return (await response.json()) as DestinationChangesResponse;
}

export async function fetchDestinationChangeById(changeId: string): Promise<DestinationChangeDetailResponse> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/admin/destination-changes/${changeId}`, {
    method: "GET",
  });

  return (await response.json()) as DestinationChangeDetailResponse;
}

export interface CreateDestinationChangePayload {
  action: "create" | "update" | "delete";
  destination_id?: string;
  fields: DestinationChangeFields;
}

export interface UpdateDestinationChangePayload {
  draft_version?: number;
  fields: DestinationChangeFields;
}

export async function createDestinationChange(
  payload: CreateDestinationChangePayload
): Promise<DestinationChangeDetailResponse> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/admin/destination-changes`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return (await response.json()) as DestinationChangeDetailResponse;
}

export async function updateDestinationChange(
  changeId: string,
  payload: UpdateDestinationChangePayload
): Promise<DestinationChangeDetailResponse> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/admin/destination-changes/${changeId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return (await response.json()) as DestinationChangeDetailResponse;
}

export interface ApproveDestinationChangeResponse {
  change_request: DestinationChange;
  destination?: Record<string, unknown>;
  message?: string;
}

export interface SubmitDestinationChangeResponse {
  change_request?: DestinationChange;
  message?: string;
}

export async function approveDestinationChange(changeId: string): Promise<ApproveDestinationChangeResponse> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/api/v1/admin/destination-changes/${changeId}/approve`,
    { method: "POST" }
  );

  return (await response.json()) as ApproveDestinationChangeResponse;
}

export async function rejectDestinationChange(changeId: string, message: string): Promise<ApproveDestinationChangeResponse> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/api/v1/admin/destination-changes/${changeId}/reject`,
    {
      method: "POST",
      body: JSON.stringify({ message }),
    }
  );

  return (await response.json()) as ApproveDestinationChangeResponse;
}

export async function submitDestinationChange(changeId: string): Promise<SubmitDestinationChangeResponse> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/api/v1/admin/destination-changes/${changeId}/submit`,
    {
      method: "POST",
      body: JSON.stringify({}),
    }
  );

  try {
    return (await response.json()) as SubmitDestinationChangeResponse;
  } catch {
    return {};
  }
}

export const api = {
  get: (url: string) =>
    fetchWithAuth(`${API_BASE_URL}${url}`, { method: "GET" }).then((res) => res.json()),
  post: <T extends object>(url: string, data: T) =>
    fetchWithAuth(`${API_BASE_URL}${url}`, {
      method: "POST",
      body: JSON.stringify(data),
    }).then((res) => res.json()),
  put: <T extends object>(url: string, data: T) =>
    fetchWithAuth(`${API_BASE_URL}${url}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }).then((res) => res.json()),
  delete: (url: string) =>
    fetchWithAuth(`${API_BASE_URL}${url}`, { method: "DELETE" }).then((res) => res.json()),
};

export interface MediaUploadResponse {
  change_request: DestinationChange;
  gallery_uploads?: Array<{
    ordering?: number;
    upload_id?: string;
    url?: string;
  }>;
}

export async function uploadDestinationGallery(changeId: string, files: File[]): Promise<MediaUploadResponse> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/admin/destination-changes/${changeId}/gallery`, {
    method: "POST",
    body: formData,
  });
  return (await response.json()) as MediaUploadResponse;
}

export async function uploadDestinationHeroImage(changeId: string, file: File): Promise<MediaUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/admin/destination-changes/${changeId}/hero-image`, {
    method: "POST",
    body: formData,
  });
  return (await response.json()) as MediaUploadResponse;
}

export interface DestinationImportTemplate {
  headers: string[];
  sample_row?: string[];
}

export interface DestinationImportTemplateResponse {
  template: DestinationImportTemplate;
}

export type DestinationImportStatus = "queued" | "processing" | "completed" | "failed";

export interface DestinationImportJob {
  id: string;
  status?: DestinationImportStatus;
  dry_run?: boolean;
  file_key?: string;
  error_csv_key?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  submitted_at?: string;
  completed_at?: string;
  uploaded_by?: string;
  total_rows?: number;
  processed_rows?: number;
  rows_failed?: number;
  changes_created?: number;
  pending_change_ids?: string[];
}

export interface DestinationImportRow {
  id?: string;
  job_id?: string;
  row_number?: number;
  action?: string;
  destination_id?: string;
  change_id?: string;
  status?: "pending_review" | "skipped" | "failed";
  error?: string;
  payload?: DestinationChangeFields;
}

export interface DestinationImportResponse {
  job: DestinationImportJob;
  rows?: DestinationImportRow[];
}

export interface UploadDestinationImportParams {
  dry_run?: boolean;
  submit?: boolean;
  notes?: string;
}

export async function fetchDestinationImportTemplate(): Promise<DestinationImportTemplateResponse> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/admin/destination-imports/template`, {
    method: "GET",
  });

  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  const raw = await response.text();

  const parseCsvRow = (row: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"' && inQuotes && row[i + 1] === '"') {
        current += '"';
        i++;
        continue;
      }
      if (char === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
        continue;
      }
      current += char;
    }
    result.push(current);
    return result;
  };

  // Prefer JSON if provided
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(raw) as DestinationImportTemplateResponse;
    } catch {
      throw new Error("Unable to parse template response.");
    }
  }

  // Accept CSV/plain responses and adapt to the JSON shape
  const looksLikeCsv = contentType.includes("text/csv") || contentType.includes("text/plain") || raw.trim().startsWith("slug,");
  if (looksLikeCsv) {
    const lines = raw.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) {
      throw new Error("Template endpoint returned an empty CSV.");
    }
    const headers = parseCsvRow(lines[0]);
    const sampleRow = lines[1] ? parseCsvRow(lines[1]) : [];
    return { template: { headers, sample_row: sampleRow } };
  }

  throw new Error(raw || "Template endpoint did not return JSON or CSV.");
}

export async function uploadDestinationImport(
  file: File,
  params: UploadDestinationImportParams = {}
): Promise<DestinationImportResponse> {
  const query = new URLSearchParams();
  if (params.dry_run) query.set("dry_run", "true");
  if (params.submit === false) query.set("submit", "false");

  const queryString = query.toString();
  const url = `${API_BASE_URL}/api/v1/admin/destination-imports${queryString ? `?${queryString}` : ""}`;

  const formData = new FormData();
  formData.append("file", file);
  if (params.notes) {
    formData.append("notes", params.notes);
  }

  const response = await fetchWithAuth(url, {
    method: "POST",
    body: formData,
  });

  return (await response.json()) as DestinationImportResponse;
}

export async function fetchDestinationImportJob(jobId: string): Promise<DestinationImportResponse> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/admin/destination-imports/${jobId}`, {
    method: "GET",
  });
  return (await response.json()) as DestinationImportResponse;
}

export async function downloadDestinationImportErrors(jobId: string): Promise<Blob> {
  const response = await fetchWithAuth(`${API_BASE_URL}/api/v1/admin/destination-imports/${jobId}/errors`, {
    method: "GET",
    headers: { Accept: "text/csv", "Content-Type": "" },
  });
  return await response.blob();
}
