// src/components/searchBar.tsx

import { useId, useState, useEffect, useRef } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { searchDestinations } from "../services/auth/destinationService";
import type {
  Destination,
  CategoryFilter,
  SortOption,
} from "../types/destination";
import { getSearchHistory, addToSearchHistory } from "../utils/searchHistory";

type Props = {
  placeholder?: string;
  defaultValue?: string;
  onSearch?: (query: string) => void;
  className?: string;
  loading?: boolean;
};

const CATEGORIES: CategoryFilter[] = ["Culture", "Food", "Nature", "Sport"];

export default function SearchBar({
  placeholder = "Find your places to go",
  defaultValue = "",
  onSearch,
  className = "",
}: Props) {
  const [q, setQ] = useState(defaultValue);
  const [results, setResults] = useState<Destination[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  // 🆕 Single filter (category or popularity)
  const [selectedFilter, setSelectedFilter] = useState<string>("");

  const inputId = useId();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Load search history on mount
  useEffect(() => {
    setSearchHistory(getSearchHistory());
  }, []);

  // Debounced search
  useEffect(() => {
    const trimmedQuery = q.trim();

    if (trimmedQuery.length < 2) {
      setResults([]);
      if (isFocused && searchHistory.length > 0) {
        setShowDropdown(true);
      } else {
        setShowDropdown(false);
      }
      return;
    }

    setIsSearching(true);
    setError(null);

    const timeoutId = setTimeout(async () => {
      try {
        console.log("[SearchBar] Searching for:", trimmedQuery);


        const isPopularity = selectedFilter === "popularity";
        const sort: SortOption = isPopularity ? "rating_desc" : "rating_desc";
        const categories: CategoryFilter[] =
          !isPopularity && selectedFilter
            ? [selectedFilter as CategoryFilter]
            : [];

        const response = await searchDestinations(trimmedQuery, 20, {
          sort,
          categories: categories.length ? categories : undefined,
        });

        const withHero: Destination[] = (response.destinations || []).map((d) => ({
          ...d,
          hero_image_url: d.gallery?.[0]?.url ?? d.hero_image_url,
        }));

        console.log("[SearchBar] Raw results:", withHero.length);

        const queryLower = trimmedQuery.toLowerCase();
        const matchesWordStart = (text: string): boolean => {
          if (!text) return false;
          const words = text.toLowerCase().split(/[\s-_]+/);
          return words.some((word) => word.startsWith(queryLower));
        };

        const filtered = withHero
          .filter((dest) => {
            return (
              (!categories.length ||
                categories.includes(dest.category as CategoryFilter)) &&
              (matchesWordStart(dest.name || "") ||
                matchesWordStart(dest.city || "") ||
                matchesWordStart(dest.country || "") ||
                matchesWordStart(dest.category || "") ||
                matchesWordStart(dest.description || ""))
            );
          })
          .slice(0, 5);

        setResults(filtered);
        setShowDropdown(true);
      } catch (err) {
        console.error("[SearchBar] Search error:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to search destinations";
        setError(errorMessage);
        setResults([]);
        setShowDropdown(false);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [q, isFocused, searchHistory.length, selectedFilter]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setIsFocused(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();


    const active = document.activeElement as HTMLElement | null;
    const optionFocused =
      active &&
      dropdownRef.current?.contains(active) &&
      active.getAttribute("role") === "option";

    if (optionFocused) {
      active.click();
      return;
    }

    // ignoring the first dropdown result.
    if (trimmed) {
      addToSearchHistory(trimmed);
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
      setShowDropdown(false);
      onSearch?.(trimmed);
      setQ("");
    }
  }

  function handleResultClick(destination: Destination) {
    addToSearchHistory(q.trim());
    if (destination.id) {
      navigate(`/destination/${destination.id}`);
    }
    setShowDropdown(false);
    setQ("");
  }

  function handleHistoryClick(historyQuery: string) {
    setQ(historyQuery);
    inputRef.current?.focus();
  }

  function handleFocus() {
    setIsFocused(true);
    if (q.trim().length < 2 && searchHistory.length > 0) {
      setShowDropdown(true);
    } else if (results.length > 0) {
      setShowDropdown(true);
    }
  }

  const showHistory =
    showDropdown && q.trim().length < 2 && searchHistory.length > 0;
  const showResults =
    showDropdown && results.length > 0 && q.trim().length >= 2;
  const showNoResults =
    showDropdown &&
    results.length === 0 &&
    q.trim().length >= 2 &&
    !isSearching &&
    !error;

  return (
    <div className="relative w-full">
      <form
        role="search"
        aria-labelledby={`${inputId}-label`}
        onSubmit={handleSubmit}
        className={[
          "flex items-center gap-3 rounded-full border border-black/5",
          "bg-amber-50 shadow-[0_2px_0_rgba(0,0,0,.08)]",
          "w-full h-12 md:h-14 px-4 md:px-7",
          className,
        ].join(" ")}
      >
        <span
          aria-hidden
          className="material-symbols-outlined text-slate-600 opacity-70"
        >
          search
        </span>

        <span id={`${inputId}-label`} className="sr-only">
          Search the site
        </span>

        <input
          ref={inputRef}
          id={inputId}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={handleFocus}
          placeholder={placeholder}
          aria-label={placeholder}
          aria-autocomplete="list"
          aria-controls={showDropdown ? `${inputId}-results` : undefined}
          aria-expanded={showDropdown}
          className={[
            "w-full bg-transparent outline-none",
            "text-slate-800 placeholder:text-slate-700/70",
            "text-[16px]",
          ].join(" ")}
        />

        {/* 🆕 Single Blue Filter Select */}
        {/* <select
          value={selectedFilter}
          onChange={(e) => setSelectedFilter(e.target.value)}
          className={[
            "rounded-xl bg-gradient-to-r from-[#019a9f] to-[#016B71] text-white font-semibold shadow-lg",
            "ring-1 ring-[#1ad1d6] focus:ring-2 focus:ring-[#01e0eb] hover:bg-[#018386]",
            "outline-none cursor-pointer backdrop-blur-sm transition-all duration-300",
            // responsive sizing
            "px-3 py-1.5 text-xs",
            "sm:px-4 sm:py-2 sm:text-sm",
            "md:px-5 md:text-sm",
            "lg:px-6 lg:text-base",
          ].join(" ")}
        >
          <option value="">Filter</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
          <option value="popularity">Popularity</option>
        </select> */}
      </form>

      {/* Dropdown Results */}
      {(showHistory || showResults || showNoResults) && (
        <div
          ref={dropdownRef}
          id={`${inputId}-results`}
          role="listbox"
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden z-50 max-h-96 overflow-y-auto"
        >
          {/* History */}
          {showHistory && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">
                Recent Searches
              </div>
              {searchHistory.map((historyQuery, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleHistoryClick(historyQuery)}
                  className="w-full px-4 py-2 text-left hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-3"
                >
                  <span className="material-symbols-outlined text-slate-400 text-lg">
                    history
                  </span>
                  <span className="text-slate-700">{historyQuery}</span>
                </button>
              ))}
            </div>
          )}

          {/* Results */}
          {showResults &&
            results.map((destination) => (
              <button
                key={destination.id}
                type="button"
                role="option"
                onClick={() => handleResultClick(destination)}
                className="w-full px-5 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 flex items-start gap-3"
              >
                {destination.hero_image_url && (
                  <img
                    src={destination.hero_image_url}
                    alt=""
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 truncate">
                    {destination.name}
                  </div>
                  <div className="text-sm text-slate-600 flex items-center gap-2 mt-1">
                    <span className="material-symbols-outlined text-base">
                      location_on
                    </span>
                    <span className="truncate">
                      {destination.city && destination.country
                        ? `${destination.city}, ${destination.country}`
                        : destination.city ||
                          destination.country ||
                          "Location not specified"}
                    </span>
                  </div>
                  {destination.contact && (
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">
                        phone
                      </span>
                      <span>{destination.contact}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    {destination.category && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-medium text-xs">
                        {destination.category}
                      </span>
                    )}
                    {destination.average_rating !== undefined && (
                      <div className="flex items-center gap-1 text-xs text-amber-600">
                        <span className="material-symbols-outlined text-sm">
                          star
                        </span>
                        <span className="font-semibold">
                          {destination.average_rating.toFixed(1)}
                        </span>
                        {destination.total_reviews !== undefined && (
                          <span className="text-slate-500">
                            ({destination.total_reviews})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}

          {/* No Results */}
          {showNoResults && (
            <div className="px-5 py-8 text-center text-slate-600">
              <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">
                search_off
              </span>
              <p className="font-medium">No destinations found</p>
              <p className="text-sm mt-1">Please try different keywords</p>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
