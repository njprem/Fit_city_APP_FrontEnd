// src/services/destinationService.ts

import { API_BASE_URL } from "../../config";
import type { 
  DestinationsResponse, 
  DestinationResponse, 
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
): Promise<any> {
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

    const data = await response.json();
    console.log("[DEBUG] Destination reviews:", data);
    return data;
  } catch (error) {
    console.error("[DEBUG] Get destination reviews error:", error);
    throw error;
  }
}
