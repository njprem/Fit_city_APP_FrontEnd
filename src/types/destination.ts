// src/types/destination.ts

export interface GalleryImage {
  caption: string;
  ordering: number;
  url: string;
}

export interface Destination {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  hero_image_url: string;
  opening_time?: string;
  closing_time?: string;
  contact?: string;
  gallery?: GalleryImage[];
  status: string;
  created_at: string;
  updated_at: string;
  updated_by?: string;
  version: number;
  deleted_at?: string;
}

export interface DestinationsResponse {
  destinations: Destination[];
  meta: {
    count: number;
    limit: number;
    offset: number;
  };
}

export interface DestinationResponse {
  destination: Destination;
}