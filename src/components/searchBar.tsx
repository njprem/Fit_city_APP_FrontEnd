// src/components/searchBar.tsx

import { useId, useState, useEffect, useRef } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { searchDestinations } from "../services/auth/destinationService";
import type { Destination } from "../types/destination";

type Props = {
  placeholder?: string;
  defaultValue?: string;
  onSearch?: (query: string) => void;
  className?: string;
  loading?: boolean;
};

export default function SearchBar({
  placeholder = "Find your places to go",
  defaultValue = "",
  onSearch,
  className = "",
  loading = false,
}: Props) {
  const [q, setQ] = useState(defaultValue);
  const [results, setResults] = useState<Destination[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputId = useId();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Debounce search with client-side filtering
  useEffect(() => {
    const trimmedQuery = q.trim();

    if (trimmedQuery.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    setError(null);

    const timeoutId = setTimeout(async () => {
      try {
        console.log("[SearchBar] Searching for:", trimmedQuery);
        const response = await searchDestinations(trimmedQuery, 20); // Get more results
        console.log(
          "[SearchBar] Raw results from API:",
          response.destinations.length
        );

        // Client-side filtering: match beginning of words only
        const queryLower = trimmedQuery.toLowerCase();

        // Helper function to check if query matches start of any word in text
        const matchesWordStart = (text: string): boolean => {
          if (!text) return false;
          const words = text.toLowerCase().split(/[\s-_]+/); // Split by space, dash, underscore
          return words.some((word) => word.startsWith(queryLower));
        };

        const filtered = response.destinations
          .filter((dest) => {
            return (
              matchesWordStart(dest.name || "") ||
              matchesWordStart(dest.city || "") ||
              matchesWordStart(dest.country || "")
            );
          })
          .slice(0, 5); // Limit to 5 results

        console.log("[SearchBar] Filtered results:", filtered.length);
        setResults(filtered);
        setShowDropdown(filtered.length > 0);
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
  }, [q]);

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
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();

    if (results.length > 0) {
      // Navigate to first result
      navigate(`/destination/${results[0].slug}`);
      setShowDropdown(false);
    } else if (trimmed) {
      onSearch?.(trimmed);
    }
  }

  function handleResultClick(destination: Destination) {
    navigate(`/destination/${destination.slug}`);
    setShowDropdown(false);
    setQ("");
  }

  return (
    <div className="relative w-full">
      <form
        role="search"
        aria-labelledby={`${inputId}-label`}
        onSubmit={handleSubmit}
        className={[
          "flex items-center gap-3 rounded-full border border-black/5",
          "bg-amber-50 shadow-[0_2px_0_rgba(0,0,0,.08)]",
          "w-full h-12 md:h-14 px-4 md:px-5",
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
          onFocus={() => {
            if (results.length > 0) setShowDropdown(true);
          }}
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

        <button
          type="submit"
          disabled={loading || isSearching}
          className={[
            "min-w-[96px] rounded-full border-1 border-[#d8f9f9]",
            "bg-[#016B71] px-4 py-2 font-bold text-white",
            "shadow-[0_4px_0_rgba(0,0,0,.18)]",
            "transition hover:bg-teal-800 active:translate-y-[1px]",
            "disabled:opacity-60 disabled:cursor-not-allowed",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400",
          ].join(" ")}
        >
          {loading || isSearching ? "Searching…" : "Search"}
        </button>
      </form>

      {/* Dropdown Results */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          id={`${inputId}-results`}
          role="listbox"
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden z-50 max-h-96 overflow-y-auto"
        >
          {results.map((destination) => (
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
                    {destination.city}, {destination.country}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-medium">
                    {destination.category}
                  </span>
                </div>
              </div>
            </button>
          ))}
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
