import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/navbar";
import Footer from "../../components/footer";
import { favoritesEvents, loadFavorites, removeFavoriteByDestinationId, type FavoriteAddDetail, type FavoriteItemLike, type FavoriteRemoveDetail } from "../../services/favoritesService";
import { getDestinationById } from "../../api";
import { MapPin, Phone, Heart, Star, StarHalf } from "lucide-react";
import type { Destination, DestinationByIdPayload, DestinationResponse } from "../../types/destination";

type FavoriteItem = FavoriteItemLike;

function RatingStars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f-${i}`} className="h-4 w-4 text-yellow-500" strokeWidth={2} fill="currentColor" aria-hidden />
      ))}
      {half === 1 && (
        <span key="half" className="relative inline-block h-4 w-4" aria-hidden>
          <Star className="absolute inset-0 h-4 w-4 text-yellow-500" strokeWidth={2} />
          <StarHalf className="absolute inset-0 h-4 w-4 text-yellow-500" strokeWidth={2} fill="currentColor" />
        </span>
      )}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e-${i}`} className="h-4 w-4 text-yellow-500" strokeWidth={2} aria-hidden />
      ))}
    </div>
  );
}

const isDestinationResponse = (payload: DestinationByIdPayload): payload is DestinationResponse => {
  return typeof payload === "object" && payload !== null && "destination" in payload;
};

const extractDestination = (payload: DestinationByIdPayload): Destination => {
  return isDestinationResponse(payload) ? payload.destination : payload;
};

type DestinationLike = Destination & {
  rating?: number;
  review_count?: number;
  heroImageUrl?: string;
  cover_url?: string;
};

export default function FavoritePage() {
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ====== โหลดรายการโปรดจาก API ======
  useEffect(() => {
    setLoading(true);
    try {
      const list = loadFavorites();
      setItems(list);
      setError(null);
    } catch (e) {
      console.error(e);
      setError("Failed to load favorites");
    } finally {
      setLoading(false);
    }
  }, []);

  // Augment favorites with rating/review_count if missing by fetching destination details
  useEffect(() => {
    let cancelled = false;
    async function enrich() {
      const lacking = items.filter(
        (it) =>
          typeof it.destination?.rating !== "number" ||
          typeof it.destination?.review_count !== "number"
      );
      if (lacking.length === 0) return;
      try {
        const updates = await Promise.all(
          lacking.map(async (fav) => {
            try {
              const raw = await getDestinationById(fav.destination_id);
              const destination = extractDestination(raw) as DestinationLike;
              const rating =
                typeof destination.rating === "number"
                  ? destination.rating
                  : typeof destination.average_rating === "number"
                  ? destination.average_rating
                  : undefined;
              const review_count =
                typeof destination.review_count === "number"
                  ? destination.review_count
                  : typeof destination.total_reviews === "number"
                  ? destination.total_reviews
                  : undefined;
              const hero_image_url =
                destination.gallery?.[0]?.url ??
                destination.hero_image_url ??
                destination.heroImageUrl ??
                destination.cover_url ??
                fav.destination?.hero_image_url;
              const name = destination.name ?? fav.destination?.name;
              const city = destination.city ?? fav.destination?.city;
              const country = destination.country ?? fav.destination?.country;
              return { destination_id: fav.destination_id, rating, review_count, hero_image_url, name, city, country };
            } catch {
              return null;
            }
          })
        );
        if (cancelled) return;
        setItems((prev) =>
          prev.map((it) => {
            const u = updates.find((x): x is NonNullable<typeof x> => Boolean(x && x.destination_id === it.destination_id));
            if (!u) return it;
            return {
              ...it,
              destination: {
                ...it.destination,
                name: u.name,
                city: u.city,
                country: u.country,
                hero_image_url: u.hero_image_url,
                rating: u.rating ?? it.destination?.rating,
                review_count: u.review_count ?? it.destination?.review_count,
              },
            };
          })
        );
      } catch {
        // ignore
      }
    }
    enrich();
    return () => {
      cancelled = true;
    };
  }, [items]);

  // ฟัง event จากหน้าอื่น (เช่น DestinationDetailPage) เพื่ออัปเดตรายการแบบเรียลไทม์
  useEffect(() => {
    const offAdd = favoritesEvents.onAdd((event: CustomEvent<FavoriteAddDetail>) => {
      const fav = event.detail;
      setItems((prev) => {
        const exists = prev.some((x) => x.destination_id === fav.destination_id);
        if (exists) {
          return prev.map((x) => (x.destination_id === fav.destination_id ? { ...x, ...fav } : x));
        }
        return [fav, ...prev];
      });
    });

    const offRemove = favoritesEvents.onRemove((event: CustomEvent<FavoriteRemoveDetail>) => {
      const { destination_id } = event.detail;
      setItems((prev) => prev.filter((x) => x.destination_id !== destination_id));
    });

    return () => {
      offAdd();
      offRemove();
    };
  }, []);

  // ====== ยกเลิก favorite (optimistic) ======
  async function handleUnfavorite(favId: string) {
    const prev = items;
    const target = items.find((x) => x.id === favId);
    const destination_id = target?.destination_id;
    if (!destination_id) return;
    setItems((s) => s.filter((x) => x.id !== favId));
    try {
      await removeFavoriteByDestinationId(destination_id);
    } catch (e) {
      console.error(e);
      setItems(prev);
      alert("Unable to remove from favorites. Please try again.");
    }
  }

  // ====== UI ======
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-10">
        <header className="max-w-5xl mx-auto mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Favorite List</h1>
        </header>

        <section className="max-w-5xl mx-auto grid gap-8">
          {/* Loading */}
          {loading && (
            <div className="text-slate-500">Loading favorites…</div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="text-red-600">{error}</div>
          )}

          {/* Empty */}
          {!loading && !error && items.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500">
              You have no favorites yet.
            </div>
          )}

          {/* List */}
          {!loading &&
            !error &&
            items.map((fav) => {
              const d = fav.destination ?? {};
              const title = [d.name, d.city].filter(Boolean).join(", ");
              // NOTE: mock ไม่ให้เรตติ้ง/รีวิว → ทำ fallback เพื่อ “หน้าตาเหมือนรูป”
              const rating = typeof d.rating === "number" ? d.rating : undefined;
              const reviewCount =
                typeof d.review_count === "number" ? d.review_count : undefined;

              return (
                <article
                  key={fav.id}
                  className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 transition hover:shadow-md"
                >
                  <div className="flex gap-5">
                    {/* รูปซ้าย */}
                    <Link
                      to={`/destination/${fav.destination_id}`}
                      className="shrink-0"
                      aria-label={`Open ${d.name ?? "destination"}`}
                    >
                      <img
                        src={d.hero_image_url || "/assets/destinations/sky-1.jpg"}
                        alt={d.name ?? "destination"}
                        className="w-[280px] h-40 object-cover rounded-xl"
                        loading="lazy"
                      />
                    </Link>

                    {/* ขวา: เนื้อหา */}
                    <div className="flex-1 flex flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Link
                            to={`/destination/${fav.destination_id}`}
                            className="text-[22px] font-semibold text-slate-900 hover:underline"
                          >
                            {title || d.name || "—"}
                          </Link>

                          {/* Location */}
                          {(d.city || d.country) && (
                            <div className="mt-3 flex items-start gap-3">
                              <MapPin className="h-5 w-5 text-slate-900 mt-0.5" aria-hidden />
                              <div>
                                <p className="text-[15px] font-semibold text-slate-900">
                                  Location
                                </p>
                                <p className="text-[14px] text-slate-500">
                                  {[d.city, d.country].filter(Boolean).join(", ")}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Contact (แสดงเมื่อมีใน API จริง) */}
                          {d.contact && (
                            <div className="mt-3 flex items-start gap-3">
                              <Phone className="h-5 w-5 text-slate-900 mt-0.5" aria-hidden />
                              <div>
                                <p className="text-[15px] font-semibold text-slate-900">
                                  Contact
                                </p>
                                <p className="text-[14px] text-slate-500">{d.contact}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* ปุ่มหัวใจ unfavorite */}
                        <button
                          type="button"
                          className="p-2 rounded-full hover:bg-slate-50"
                          aria-label="Remove from favorites"
                          title="Remove from favorites"
                          onClick={() => handleUnfavorite(fav.id)}
                          aria-pressed
                        >
                          <Heart className="h-6 w-6 text-rose-500" fill="currentColor" strokeWidth={2} />
                        </button>
                      </div>

                      {/* Rating */}
                      <div className="mt-6 flex items-center justify-end gap-2">
                        {typeof rating === "number" && (
                          <>
                            <RatingStars rating={rating} />
                            <span className="text-sm text-slate-900">{rating.toFixed(1)}</span>
                          </>
                        )}
                        {typeof reviewCount === "number" && (
                          <span className="text-sm text-slate-500">({reviewCount} reviews)</span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
        </section>
      </main>
      <Footer />
    </div>
  );
}
