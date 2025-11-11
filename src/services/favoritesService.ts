// src/services/favoritesService.ts
import { api } from "../api";

export type FavoriteItemLike = {
  id: string;
  destination_id: string;
  saved_at?: string;
  destination: {
    name?: string;
    city?: string;
    country?: string;
    category?: string;
    hero_image_url?: string;
    slug?: string;
    contact?: string;
    rating?: number;
    review_count?: number;
  };
};

export type FavoriteAddDetail = FavoriteItemLike;
export type FavoriteRemoveDetail = { destination_id: string };

const EVENT_ADD = "favorites:add";
const EVENT_REMOVE = "favorites:remove";
const STORAGE_KEY = "favorites";
const USE_SERVER = false; // set true when backend endpoints are ready

export const favoritesEvents = {
  onAdd(listener: (e: CustomEvent<FavoriteAddDetail>) => void) {
    const handler = listener as EventListener;
    window.addEventListener(EVENT_ADD, handler as EventListener);
    return () => window.removeEventListener(EVENT_ADD, handler as EventListener);
  },
  onRemove(listener: (e: CustomEvent<FavoriteRemoveDetail>) => void) {
    const handler = listener as EventListener;
    window.addEventListener(EVENT_REMOVE, handler as EventListener);
    return () => window.removeEventListener(EVENT_REMOVE, handler as EventListener);
  },
};

function emitAdd(detail: FavoriteAddDetail) {
  window.dispatchEvent(new CustomEvent<FavoriteAddDetail>(EVENT_ADD, { detail }));
}

function emitRemove(detail: FavoriteRemoveDetail) {
  window.dispatchEvent(new CustomEvent<FavoriteRemoveDetail>(EVENT_REMOVE, { detail }));
}

export function loadFavorites(): FavoriteItemLike[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as FavoriteItemLike[]) : [];
  } catch {
    return [];
  }
}

function saveFavorites(items: FavoriteItemLike[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore quota errors
  }
}

export async function addFavorite(snapshot: FavoriteItemLike): Promise<FavoriteItemLike> {
  if (USE_SERVER) {
    try {
      const res = await api.post("/api/v1/favorites", { destination_id: snapshot.destination_id });
      const created: FavoriteItemLike = {
        id: String(res?.id ?? `local:${snapshot.destination_id}`),
        destination_id: snapshot.destination_id,
        saved_at: res?.saved_at ?? new Date().toISOString(),
        destination: snapshot.destination,
      };
      const current = loadFavorites();
      const exists = current.some((x) => x.destination_id === created.destination_id);
      const next = exists
        ? current.map((x) => (x.destination_id === created.destination_id ? created : x))
        : [created, ...current];
      saveFavorites(next);
      emitAdd(created);
      return created;
    } catch {
      // fallthrough to local
    }
  }

  const localItem: FavoriteItemLike = {
    id: `local:${snapshot.destination_id}`,
    destination_id: snapshot.destination_id,
    saved_at: new Date().toISOString(),
    destination: snapshot.destination,
  };
  const current = loadFavorites();
  const exists = current.some((x) => x.destination_id === localItem.destination_id);
  const next = exists
    ? current.map((x) => (x.destination_id === localItem.destination_id ? localItem : x))
    : [localItem, ...current];
  saveFavorites(next);
  emitAdd(localItem);
  return localItem;
}

export async function removeFavoriteByDestinationId(destination_id: string): Promise<void> {
  if (USE_SERVER) {
    try {
      await api.delete(`/api/v1/favorites/by-destination/${destination_id}`);
    } catch {
      // ignore
    }
  }
  const current = loadFavorites();
  const next = current.filter((x) => x.destination_id !== destination_id);
  saveFavorites(next);
  emitRemove({ destination_id });
}
