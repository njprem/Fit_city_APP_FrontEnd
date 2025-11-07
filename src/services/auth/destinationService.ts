// src/services/destinationService.ts
// TOGGLE: Set USE_MOCK to false when backend is fixed

import type { DestinationsResponse, DestinationResponse } from "../../types/destination";

const USE_MOCK = false; // Change to false when backend is working

// Mock data for development
const MOCK_DESTINATIONS = [
  {
    id: "1da5f07d-7dcf-4aea-b948-7c9daa0a5db7",
    name: "Central Park",
    slug: "central-park",
    description: "Iconic urban park spanning 843 acres in the heart of Manhattan.",
    category: "Nature",
    city: "New York",
    country: "USA",
    latitude: 40.785091,
    longitude: -73.968285,
    hero_image_url: "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=800",
    opening_time: "06:00",
    closing_time: "01:00",
    contact: "+1-212-310-6600",
    status: "published",
    created_at: "2024-07-10T12:00:00Z",
    updated_at: "2024-07-11T08:00:00Z",
    version: 3,
    gallery: [
      {
        caption: "Summer blooms near the lake",
        ordering: 1,
        url: "https://images.unsplash.com/photo-1564419320461-6870880221ad?w=600"
      }
    ]
  },
  {
    id: "2eb6g18e-8edf-5bfb-a959-8d0ebb1b6ec8",
    name: "Eiffel Tower",
    slug: "eiffel-tower",
    description: "Iconic iron lattice tower on the Champ de Mars in Paris.",
    category: "Culture",
    city: "Paris",
    country: "France",
    latitude: 48.858844,
    longitude: 2.294351,
    hero_image_url: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800",
    opening_time: "09:00",
    closing_time: "23:45",
    contact: "+33 892 70 12 39",
    status: "published",
    created_at: "2024-07-10T12:00:00Z",
    updated_at: "2024-07-11T08:00:00Z",
    version: 2,
    gallery: []
  },
  {
    id: "3fc7h29f-9feg-6cgc-ba6a-9e1fcc2c7fd9",
    name: "Tokyo Skytree",
    slug: "tokyo-skytree",
    description: "Broadcasting and observation tower in Sumida, Tokyo.",
    category: "Culture",
    city: "Tokyo",
    country: "Japan",
    latitude: 35.710063,
    longitude: 139.810775,
    hero_image_url: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800",
    opening_time: "08:00",
    closing_time: "22:00",
    contact: "+81 3-5302-3470",
    status: "published",
    created_at: "2024-07-10T12:00:00Z",
    updated_at: "2024-07-11T08:00:00Z",
    version: 1,
    gallery: []
  },
  {
    id: "4gd8i30g-0gfh-7dhd-cb7b-0f2gdd3d8ge0",
    name: "Grand Canyon",
    slug: "grand-canyon",
    description: "Steep-sided canyon carved by the Colorado River in Arizona.",
    category: "Nature",
    city: "Arizona",
    country: "USA",
    latitude: 36.106965,
    longitude: -112.112997,
    hero_image_url: "https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=800",
    opening_time: "00:00",
    closing_time: "23:59",
    contact: "+1-928-638-7888",
    status: "published",
    created_at: "2024-07-10T12:00:00Z",
    updated_at: "2024-07-11T08:00:00Z",
    version: 1,
    gallery: []
  },
  {
    id: "5he9j41h-1hgi-8eie-dc8c-1g3hee4e9hf1",
    name: "Sydney Opera House",
    slug: "sydney-opera-house",
    description: "Multi-venue performing arts centre in Sydney, Australia.",
    category: "Culture",
    city: "Sydney",
    country: "Australia",
    latitude: -33.856784,
    longitude: 151.215297,
    hero_image_url: "https://images.unsplash.com/photo-1523059623039-a9ed027e7fad?w=800",
    opening_time: "09:00",
    closing_time: "17:00",
    contact: "+61 2 9250 7111",
    status: "published",
    created_at: "2024-07-10T12:00:00Z",
    updated_at: "2024-07-11T08:00:00Z",
    version: 2,
    gallery: []
  },
  {
    id: "6if0k52i-2ihj-9fjf-ed9d-2h4iff5f0ig2",
    name: "Neuschwanstein Castle",
    slug: "neuschwanstein-castle",
    description: "19th-century Romanesque Revival palace in Bavaria, Germany.",
    category: "Culture",
    city: "Schwangau",
    country: "Germany",
    latitude: 47.557574,
    longitude: 10.749800,
    hero_image_url: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800",
    opening_time: "09:00",
    closing_time: "18:00",
    contact: "+49 8362 930830",
    status: "published",
    created_at: "2024-07-10T12:00:00Z",
    updated_at: "2024-07-11T08:00:00Z",
    version: 1,
    gallery: []
  }
];

export async function searchDestinations(
  query: string,
  limit: number = 5
): Promise<DestinationsResponse> {
  if (USE_MOCK) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log("[MOCK] Searching destinations for:", query);
    
    // Filter mock data
    const filtered = MOCK_DESTINATIONS.filter(dest => 
      dest.name.toLowerCase().includes(query.toLowerCase()) ||
      dest.city.toLowerCase().includes(query.toLowerCase()) ||
      dest.country.toLowerCase().includes(query.toLowerCase()) ||
      dest.category.toLowerCase().includes(query.toLowerCase()) ||
      dest.description.toLowerCase().includes(query.toLowerCase())
    ).slice(0, limit);

    console.log("[MOCK] Found results:", filtered.length);

    return {
      destinations: filtered,
      meta: {
        count: filtered.length,
        limit,
        offset: 0
      }
    };
  }

  // Real API call (when backend is fixed)
  const { API_BASE_URL } = await import("../../config");
  const params = new URLSearchParams({
    query,
    limit: limit.toString(),
    offset: "0",
  });

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
  id: string
): Promise<DestinationResponse> {
  if (USE_MOCK) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log("[MOCK] Getting destination:", id);
    
    const destination = MOCK_DESTINATIONS.find(
      dest => dest.id === id || dest.slug === id
    );

    if (!destination) {
      throw new Error("Destination not found");
    }

    return { destination };
  }

  // Real API call (when backend is fixed)
  const { API_BASE_URL } = await import("../../config");
  const url = `${API_BASE_URL}/api/v1/destinations/${id}`;
  console.log("[DEBUG] Getting destination:", url);

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