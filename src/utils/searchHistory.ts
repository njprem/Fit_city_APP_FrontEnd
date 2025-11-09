// src/utils/searchHistory.ts

const SEARCH_HISTORY_KEY = "fitcity_search_history";
const MAX_HISTORY_ITEMS = 5;

export function getSearchHistory(): string[] {
  try {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addToSearchHistory(query: string): void {
  if (!query || query.trim().length < 2) return;

  try {
    const history = getSearchHistory();
    const trimmed = query.trim();

    // Remove if already exists
    const filtered = history.filter(item => item.toLowerCase() !== trimmed.toLowerCase());

    // Add to beginning
    const updated = [trimmed, ...filtered].slice(0, MAX_HISTORY_ITEMS);

    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to save search history:", error);
  }
}

export function clearSearchHistory(): void {
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (error) {
    console.error("Failed to clear search history:", error);
  }
}