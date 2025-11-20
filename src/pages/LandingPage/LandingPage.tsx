import { useEffect, useState, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/navbar";
import Footer from "../../components/footer";
import heroImage from "../../assets/mainbg.jpg";
import {
  searchDestinations,
  getDestinationReviews,
} from "../../services/auth/destinationService";
import type { CategoryFilter, Destination } from "../../types/destination";
import { Heart } from "lucide-react";
import {
  addFavorite,
  favoritesEvents,
  loadFavorites,
  removeFavoriteByDestinationId,
  type FavoriteItemLike,
} from "../../services/favoritesService";

type CategoryTab = {
  label: string;
  value: CategoryFilter;
  icon: string;
};

const CATEGORY_TABS: CategoryTab[] = [
  { label: "Culture", value: "Culture", icon: "temple_buddhist" },
  { label: "Food", value: "Food", icon: "lunch_dining" },
  { label: "Nature", value: "Nature", icon: "forest" },
  { label: "Sport", value: "Sport", icon: "sports_handball" },
];

const FALLBACK_IMAGE = heroImage;

type DestinationCardProps = {
  destination: Destination;
  isFavorite: boolean;
  favoriteBusy?: boolean;
  reviewCount?: number;
  onFavoriteToggle: (
    destination: Destination,
    nextState: boolean
  ) => void | Promise<void>;
};

const ratingFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const buildFavoriteSnapshot = (
  destination: Destination,
  reviewCount?: number
): FavoriteItemLike => {
  const rating =
    typeof destination.average_rating === "number"
      ? destination.average_rating
      : undefined;
  const resolvedReviewCount =
    typeof reviewCount === "number"
      ? reviewCount
      : typeof destination.total_reviews === "number"
      ? destination.total_reviews
      : undefined;

  return {
    id: `local:${destination.id}`,
    destination_id: destination.id,
    destination: {
      name: destination.name,
      city: destination.city || undefined,
      country: destination.country || undefined,
      category: destination.category || undefined,
      hero_image_url:
        destination.hero_image_url ||
        destination.gallery?.[0]?.url ||
        FALLBACK_IMAGE,
      slug: destination.slug || undefined,
      contact: destination.contact || undefined,
      rating,
      review_count: resolvedReviewCount,
    },
  };
};

function DestinationCard({
  destination,
  isFavorite,
  favoriteBusy,
  reviewCount,
  onFavoriteToggle,
}: DestinationCardProps) {
  const coverImage =
    destination.hero_image_url ||
    destination.gallery?.[0]?.url ||
    FALLBACK_IMAGE;
  const location = [destination.city, destination.country]
    .filter(Boolean)
    .join(", ");
  const rating =
    typeof destination.average_rating === "number"
      ? ratingFormatter.format(destination.average_rating)
      : null;
  const resolvedReviewCount =
    typeof reviewCount === "number"
      ? reviewCount
      : typeof destination.total_reviews === "number"
      ? destination.total_reviews
      : null;
  const hasReviews =
    typeof resolvedReviewCount === "number" && resolvedReviewCount > 0;
  const reviewsLabel = hasReviews
    ? `${resolvedReviewCount.toLocaleString()} ${
        resolvedReviewCount === 1 ? "review" : "reviews"
      }`
    : "Be the first review";
  const handleFavoriteClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    void onFavoriteToggle(destination, !isFavorite);
  };

  return (
    <Link
      to={`/destination/${destination.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg focus-visible:outline focus-visible:outline-offset-4 focus-visible:outline-[#016B71]"
    >
      <div className="relative h-44 w-full overflow-hidden">
        <img
          src={coverImage}
          alt={destination.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <button
          type="button"
          onClick={handleFavoriteClick}
          disabled={favoriteBusy}
          className="absolute right-4 top-4 rounded-full bg-white/80 p-2 text-[#016B71] shadow-md transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={isFavorite ? "Remove from favourites" : "Save to favourites"}
          aria-pressed={isFavorite}
        >
          <Heart
            className={`h-5 w-5 transition-colors ${
              isFavorite ? "text-red-500" : "text-[#016B71]"
            }`}
            fill={isFavorite ? "currentColor" : "none"}
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-5 py-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#016B71]">
            {destination.category}
          </p>
          <h3 className="text-lg font-semibold text-slate-900">
            {destination.name}
          </h3>
        </div>

        <div className="flex items-start gap-2 text-sm text-slate-600">
          <span className="material-symbols-outlined text-base text-[#016B71]">
            location_on
          </span>
          <span>{location || "Location coming soon"}</span>
        </div>

        <div className="flex items-start gap-2 text-sm text-slate-600">
          <span className="material-symbols-outlined text-base text-[#016B71]">
            call
          </span>
          <span>{destination.contact || "Contact not available"}</span>
        </div>

        <div className="mt-auto flex items-center justify-between text-sm font-semibold text-slate-900">
          <div className="flex items-center gap-1 text-[#F5A524]">
            <span className="material-symbols-outlined text-xl">star</span>
            <span>{rating ?? "New"}</span>
          </div>
          <span className="text-xs font-medium text-slate-500">
            {reviewsLabel}
          </span>
        </div>
      </div>
    </Link>
  );
}

export const LandingPage = () => {
  const [activeCategory, setActiveCategory] =
    useState<CategoryFilter>("Nature");
  const [categoryDestinations, setCategoryDestinations] = useState<
    Destination[]
  >([]);
  const [topDestinations, setTopDestinations] = useState<Destination[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [topLoading, setTopLoading] = useState(true);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [topError, setTopError] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [favoriteBusyIds, setFavoriteBusyIds] = useState<Set<string>>(new Set());
  const [reviewCounts, setReviewCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let ignore = false;

    async function loadCategoryDestinations() {
      setCategoryLoading(true);
      setCategoryError(null);

      try {
        const response = await searchDestinations("", 8, {
          categories: [activeCategory],
          sort: "rating_desc",
        });
        if (!ignore) {
          setCategoryDestinations(response.destinations || []);
        }
      } catch (error) {
        if (!ignore) {
          const message =
            error instanceof Error
              ? error.message
              : "Unable to load destinations";
          setCategoryError(message);
          setCategoryDestinations([]);
        }
      } finally {
        if (!ignore) {
          setCategoryLoading(false);
        }
      }
    }

    loadCategoryDestinations();
    return () => {
      ignore = true;
    };
  }, [activeCategory]);

  useEffect(() => {
    let ignore = false;

    async function loadTopDestinations() {
      setTopLoading(true);
      setTopError(null);
      try {
        const response = await searchDestinations("", 4, {
          sort: "rating_desc",
        });
        if (!ignore) {
          setTopDestinations(response.destinations || []);
        }
      } catch (error) {
        if (!ignore) {
          const message =
            error instanceof Error
              ? error.message
              : "Unable to load recommendations";
          setTopError(message);
          setTopDestinations([]);
        }
      } finally {
        if (!ignore) {
          setTopLoading(false);
        }
      }
    }

    loadTopDestinations();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const existing = loadFavorites();
      setFavoriteIds(new Set(existing.map((fav) => fav.destination_id)));
    } catch {
      setFavoriteIds(new Set());
    }

    const offAdd = favoritesEvents.onAdd((event) => {
      const destinationId = event.detail.destination_id;
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        next.add(destinationId);
        return next;
      });
    });

    const offRemove = favoritesEvents.onRemove((event) => {
      const destinationId = event.detail.destination_id;
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        next.delete(destinationId);
        return next;
      });
    });

    return () => {
      offAdd();
      offRemove();
    };
  }, []);

  useEffect(() => {
    const combined = [...categoryDestinations, ...topDestinations];
    const fetchTargets = combined.filter((destination) => {
      if (typeof destination.total_reviews === "number") {
        return false;
      }
      return !Object.prototype.hasOwnProperty.call(
        reviewCounts,
        destination.id
      );
    });

    if (fetchTargets.length === 0) {
      return;
    }

    const idsToFetch = Array.from(
      new Set(fetchTargets.map((destination) => destination.id))
    );
    let cancelled = false;

    async function fetchReviewCounts() {
      const results = await Promise.all(
        idsToFetch.map(async (destinationId) => {
          try {
            const payload = await getDestinationReviews(destinationId);
            const aggregateCount =
              typeof payload.aggregate?.total_reviews === "number"
                ? payload.aggregate.total_reviews
                : Array.isArray(payload.reviews)
                ? payload.reviews.length
                : 0;
            return { destinationId, total: aggregateCount };
          } catch {
            return { destinationId, total: 0 };
          }
        })
      );

      if (cancelled) return;

      setReviewCounts((prev) => {
        const next = { ...prev };
        results.forEach(({ destinationId, total }) => {
          next[destinationId] = total;
        });
        return next;
      });
    }

    fetchReviewCounts();

    return () => {
      cancelled = true;
    };
  }, [categoryDestinations, topDestinations, reviewCounts]);

  function getResolvedReviewCount(destination: Destination) {
    if (typeof destination.total_reviews === "number") {
      return destination.total_reviews;
    }
    if (Object.prototype.hasOwnProperty.call(reviewCounts, destination.id)) {
      return reviewCounts[destination.id];
    }
    return undefined;
  }

  function markFavoriteBusy(destinationId: string, busy: boolean) {
    setFavoriteBusyIds((prev) => {
      const next = new Set(prev);
      if (busy) {
        next.add(destinationId);
      } else {
        next.delete(destinationId);
      }
      return next;
    });
  }

  async function handleFavoriteToggle(
    destination: Destination,
    shouldFavorite: boolean
  ) {
    const destinationId = destination.id;
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (shouldFavorite) {
        next.add(destinationId);
      } else {
        next.delete(destinationId);
      }
      return next;
    });

    markFavoriteBusy(destinationId, true);
    try {
      if (shouldFavorite) {
        await addFavorite(
          buildFavoriteSnapshot(destination, getResolvedReviewCount(destination))
        );
      } else {
        await removeFavoriteByDestinationId(destinationId);
      }
    } catch {
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (shouldFavorite) {
          next.delete(destinationId);
        } else {
          next.add(destinationId);
        }
        return next;
      });
    } finally {
      markFavoriteBusy(destinationId, false);
    }
  }

  return (
    <>
      <Navbar />

      <main className="flex flex-col gap-16 bg-[#F7F7F7] pb-16">
        <section className="relative isolate">
          <div className="relative h-136 w-full overflow-hidden">
            <img
              src={heroImage}
              alt="Hikers at the top of a mountain"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-r from-[#01272A]/80 via-[#01272A]/40 to-[#001417]/20" />

            <div className="relative z-10 mx-auto flex h-full w-full max-w-6xl flex-col justify-center px-6 py-12 text-white sm:px-10">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
                Explore the world with FitCity
              </p>
              <h1 className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
                Find your perfect destination
                <br />
                before you go
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-white/85">
                Discover curated guides, unforgettable activities, and local
                favourites without endless searching. Dive into culture, food,
                nature, or sports destinations tailored for every traveler.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="#category-destinations"
                  className="inline-flex items-center rounded-full bg-[#016B71] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#01585C]"
                >
                  Learn more
                  <span className="material-symbols-outlined ml-2 text-base">
                    arrow_forward
                  </span>
                </a>
                <Link
                  to="/help"
                  className="inline-flex items-center rounded-full bg-white/90 px-6 py-3 text-sm font-semibold text-[#016B71] shadow-lg transition hover:bg-white"
                >
                  Need help?
                </Link>
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center px-4 pb-4">
              <div className="w-full max-w-6xl rounded-[30px] bg-white/90 px-4 py-4 shadow-2xl backdrop-blur">
                <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {CATEGORY_TABS.map((tab) => {
                    const isActive = tab.value === activeCategory;
                    return (
                      <button
                        key={tab.value}
                        type="button"
                        onClick={() => setActiveCategory(tab.value)}
                        className={`flex w-full items-center justify-center gap-3 rounded-[26px] px-6 py-4 text-base font-semibold transition focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-[#016B71] ${
                          isActive
                            ? "bg-[#FFFDD8] text-[#016B71]"
                            : "bg-[#016B71] text-white hover:bg-[#01585C]"
                        }`}
                      >
                        <span className="material-symbols-outlined text-lg">
                          {tab.icon}
                        </span>
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="category-destinations"
          className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 2xl:max-w-[calc(100%-4in)]"
        >
          <div className="flex w-full flex-col gap-6 rounded-4xl bg-white px-6 py-10 shadow-md sm:px-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-[#016B71]">
                  {activeCategory} Collection
                </p>
                <h2 className="text-3xl font-extrabold text-slate-900">
                  {activeCategory} Destinations
                </h2>
              </div>
              <Link
                to="/search"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#016B71] hover:text-[#01585C]"
              >
                Explore more
                <span className="material-symbols-outlined text-base">
                  trending_flat
                </span>
              </Link>
            </div>

            {categoryLoading && (
              <div className="flex min-h-[200px] items-center justify-center text-slate-500">
                Loading destinations…
              </div>
            )}

            {categoryError && !categoryLoading && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
                {categoryError}
              </div>
            )}

            {!categoryLoading && !categoryError && categoryDestinations.length === 0 && (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4 text-sm text-slate-600">
                No destinations found for this category yet. Please check back
                later.
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {categoryDestinations.map((destination) => (
                <DestinationCard
                  key={destination.id}
                  destination={destination}
                  isFavorite={favoriteIds.has(destination.id)}
                  favoriteBusy={favoriteBusyIds.has(destination.id)}
                  reviewCount={getResolvedReviewCount(destination)}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 2xl:max-w-[calc(100%-4in)]">
          <div className="flex w-full flex-col gap-6 rounded-4xl bg-white px-6 py-10 shadow-md sm:px-10">
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold uppercase tracking-wide text-[#016B71]">
                Curated for you
              </p>
              <h2 className="text-3xl font-extrabold text-slate-900">
                Top Recommend
              </h2>
            </div>

            {topLoading && (
              <div className="flex min-h-[150px] items-center justify-center text-slate-500">
                Loading recommendations…
              </div>
            )}

            {topError && !topLoading && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
                {topError}
              </div>
            )}

            {!topLoading && !topError && topDestinations.length === 0 && (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4 text-sm text-slate-600">
                We will have recommendations ready soon.
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {topDestinations.map((destination) => (
                <DestinationCard
                  key={destination.id}
                  destination={destination}
                  isFavorite={favoriteIds.has(destination.id)}
                  favoriteBusy={favoriteBusyIds.has(destination.id)}
                  reviewCount={getResolvedReviewCount(destination)}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};
