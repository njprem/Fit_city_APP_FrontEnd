import { API_BASE_URL } from "./config";
import {
  getExpiresAt,
  getToken,
  logout,
  setAuthSession,
  type AuthSession,
  type AuthUser,
} from "./services/auth/authService";
import type { Destination } from "./types/destination";

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

export async function getDestinationById(id: string): Promise<any> {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/v1/destinations/${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Unable to fetch destination details");
  }

  return await res.json();
}

export async function getDestinationReviewById(id: string): Promise<any> {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/v1/destinations/${id}/reviews`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Unable to fetch destination reviews");
  }

  return await res.json();
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
