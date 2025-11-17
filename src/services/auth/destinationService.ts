// src/services/destinationService.ts

import { API_BASE_URL } from "../../config";
import { getToken, logout } from "./authService";
import type { 
  DestinationsResponse, 
  DestinationResponse, 
  DestinationReviewsPayload,
  ReviewRecord,
  SearchFilters 
} from "../../types/destination";

export async function searchDestinations(
  query: string,
  limit: number = 5,
  filters?: SearchFilters
): Promise<DestinationsResponse> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: "0",
  });

  // Only add query param if not empty
  if (query && query.trim()) {
    params.set("query", query.trim());
  }

  // Add category filters
  if (filters?.categories && filters.categories.length > 0) {
    params.set("categories", filters.categories.join(","));
  }

  // Add rating filters
  if (filters?.minRating !== undefined) {
    params.set("min_rating", filters.minRating.toString());
  }
  if (filters?.maxRating !== undefined) {
    params.set("max_rating", filters.maxRating.toString());
  }

  // Add sort
  if (filters?.sort) {
    params.set("sort", filters.sort);
  }

  const url = `${API_BASE_URL}/api/v1/destinations?${params.toString()}`;
  console.log("[DEBUG] Searching destinations:", url);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("[DEBUG] Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[DEBUG] Error response:", errorText);
      throw new Error(`Failed to search destinations: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("[DEBUG] Search results:", data);
    return data;
  } catch (error) {
    console.error("[DEBUG] Search error:", error);
    throw error;
  }
}

export async function getDestination(
  id: string,
  signal?: AbortSignal
): Promise<DestinationResponse> {
  const url = `${API_BASE_URL}/api/v1/destinations/${id}`;
  console.log("[DEBUG] Getting destination:", url);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal,
    });

    console.log("[DEBUG] Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[DEBUG] Error response:", errorText);
      throw new Error(`Failed to get destination: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("[DEBUG] Destination data:", data);
    return data;
  } catch (error) {
    console.error("[DEBUG] Get destination error:", error);
    throw error;
  }
}

// Public fetch: destination reviews (no auth)
export async function getDestinationReviews(
  id: string,
  signal?: AbortSignal
): Promise<DestinationReviewsPayload> {
  const url = `${API_BASE_URL}/api/v1/destinations/${id}/reviews`;
  console.log("[DEBUG] Getting destination reviews:", url);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal,
    });

    console.log("[DEBUG] Reviews response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[DEBUG] Reviews error response:", errorText);
      throw new Error(`Failed to get destination reviews: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as DestinationReviewsPayload;
    console.log("[DEBUG] Destination reviews:", data);
    return data;
  } catch (error) {
    console.error("[DEBUG] Get destination reviews error:", error);
    throw error;
  }
}

// Auth required: create a new review for a destination
export interface CreateReviewRequest {
  rating: number; // 1..5
  title?: string;
  content?: string; // optional per UI requirement
  images?: (Blob | File)[]; // optional images
}

export interface CreateReviewResponse {
  aggregate?: {
    average_rating?: number;
    rating_counts?: Record<string, number>;
    total_reviews?: number;
  };
  review?: ReviewRecord;
}

export async function createDestinationReview(
  id: string,
  payload: CreateReviewRequest
): Promise<CreateReviewResponse> {
  const token = getToken();
  if (!token) {
    // Align behavior with other auth flows
    logout();
    throw new Error("Not authenticated");
  }

  const form = new FormData();
  form.append("rating", String(payload.rating));
  if (payload.title) form.append("title", payload.title);
  if (payload.content) form.append("content", payload.content);
  if (payload.images && payload.images.length > 0) {
    for (const file of payload.images) {
      form.append("images", file);
    }
  }

  const res = await fetch(`${API_BASE_URL}/api/v1/destinations/${id}/reviews`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      // Intentionally omit Content-Type for FormData (browser sets boundary)
    },
    body: form,
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `Failed to create review (${res.status})`);
  }

  return (await res.json()) as CreateReviewResponse;
}

export async function deleteDestinationReview(
  destinationId: string,
  reviewId?: string
): Promise<void> {
  const token = getToken();
  if (!token) {
    logout();
    throw new Error("Not authenticated");
  }

  const candidateUrls = [
    reviewId ? `${API_BASE_URL}/api/v1/destinations/${destinationId}/reviews/${reviewId}` : null,
    reviewId ? `${API_BASE_URL}/api/v1/reviews/${reviewId}` : null,
    `${API_BASE_URL}/api/v1/destinations/${destinationId}/reviews`,
  ].filter(Boolean) as string[];

  let lastError: Error | null = null;
  for (const url of candidateUrls) {
    try {
      const res = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        return;
      }

      const txt = await res.text();
      const error = new Error(txt || `Failed to delete review (${res.status})`);
      if (res.status === 404 || res.status === 405) {
        lastError = error;
        continue;
      }
      throw error;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError ?? new Error("Failed to delete review");
}
