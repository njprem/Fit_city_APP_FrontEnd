// src/pages/Traveler/Search/SearchResultsPage.tsx

import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "../../../components/navbar";
import Footer from "../../../components/footer";
import { searchDestinations } from "../../../services/auth/destinationService";
import type {
  Destination,
  CategoryFilter,
  SortOption,
  SearchFilters,
} from "../../../types/destination";

const CATEGORIES: CategoryFilter[] = ["Culture", "Food", "Nature", "Sport"];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "rating_desc", label: "Highest Rated" },
  { value: "rating_asc", label: "Lowest Rated" },
  { value: "alpha_asc", label: "A to Z" },
  { value: "alpha_desc", label: "Z to A" },
  { value: "updated_at_desc", label: "Recently Updated" },
];

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";

  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategories, setSelectedCategories] = useState<
    CategoryFilter[]
  >([]);
  const [sortBy, setSortBy] = useState<SortOption>("rating_desc");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function fetchResults() {
      try {
        setLoading(true);
        setError(null);

        const filters: SearchFilters = {
          sort: sortBy,
        };

        if (selectedCategories.length > 0) {
          filters.categories = selectedCategories;
        }

        const response = await searchDestinations(query, 50, filters);
        setDestinations(response.destinations);
      } catch (err) {
        console.error("Search error:", err);
        setError("Failed to load search results");
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [query, selectedCategories, sortBy]);

  const toggleCategory = (category: CategoryFilter) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleDestinationClick = (id?: string) => {
    if (!id) return;
    navigate(`/destination/${id}`);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              {query ? `Search Results for "${query}"` : "All Destinations"}
            </h1>
            {!loading && (
              <p className="text-slate-600">
                Found {destinations.length}{" "}
                {destinations.length === 1 ? "destination" : "destinations"}
              </p>
            )}
          </div>

          {/* Filters and Sort Bar */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 transition"
              >
                <span className="material-symbols-outlined">tune</span>
                <span className="font-medium">Filters</span>
                {selectedCategories.length > 0 && (
                  <span className="bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                    {selectedCategories.length}
                  </span>
                )}
              </button>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-slate-600">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Category Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="mb-2 text-sm font-semibold text-slate-700">
                  Categories
                </div>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      className={[
                        "px-4 py-2 rounded-full border transition",
                        selectedCategories.includes(category)
                          ? "bg-teal-100 border-teal-500 text-teal-700 font-semibold"
                          : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#016B71] mb-4"></div>
                <p className="text-slate-600">Loading destinations...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 text-red-700 px-6 py-4 rounded-lg">
              {error}
            </div>
          )}

          {/* No Results */}
          {!loading && !error && destinations.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <span className="material-symbols-outlined text-6xl text-slate-400 mb-4">
                search_off
              </span>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                No destinations found
              </h2>
              <p className="text-slate-600 mb-6">
                Please try different keywords or adjust your filters.
              </p>
              <button
                onClick={() => {
                  setSelectedCategories([]);
                  navigate("/");
                }}
                className="px-6 py-3 bg-[#016B71] text-white rounded-full font-semibold hover:bg-[#01585C] transition"
              >
                Back to Home
              </button>
            </div>
          )}

          {/* Results Grid */}
          {!loading && !error && destinations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {destinations.map((destination) => (
                <button
                  key={destination.id}
                  onClick={() => handleDestinationClick(destination.id)}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden text-left"
                >
                  {/* Thumbnail */}
                  {destination.hero_image_url && (
                    <div className="aspect-video w-full overflow-hidden">
                      <img
                        src={destination.hero_image_url}
                        alt={destination.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4">
                    {/* Name */}
                    <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2">
                      {destination.name}
                    </h3>

                    {/* Location */}
                    {(destination.city || destination.country) && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                        <span className="material-symbols-outlined text-base">
                          location_on
                        </span>
                        <span className="truncate">
                          {destination.city && destination.country
                            ? `${destination.city}, ${destination.country}`
                            : destination.city || destination.country}
                        </span>
                      </div>
                    )}

                    {/* Contact */}
                    {destination.contact && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                        <span className="material-symbols-outlined text-base">
                          phone
                        </span>
                        <span>{destination.contact}</span>
                      </div>
                    )}

                    {/* Rating & Category */}
                    <div className="flex items-center justify-between">
                      {destination.average_rating !== undefined ? (
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={[
                                "material-symbols-outlined text-lg",
                                star <= Math.round(destination.average_rating!)
                                  ? "text-amber-400"
                                  : "text-slate-300",
                              ].join(" ")}
                            >
                              star
                            </span>
                          ))}
                          <span className="ml-1 text-sm font-semibold text-slate-700">
                            {destination.average_rating.toFixed(1)}
                          </span>
                          {destination.total_reviews !== undefined && (
                            <span className="text-sm text-slate-500">
                              ({destination.total_reviews})
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-slate-500">
                          No ratings yet
                        </div>
                      )}

                      {destination.category && (
                        <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-medium">
                          {destination.category}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
