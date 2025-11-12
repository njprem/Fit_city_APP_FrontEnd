// src/pages/Traveler/Destination/DestinationDetailPage.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../../components/navbar";
import Footer from "../../../components/footer";
import { getDestinationById, getDestinationReviewById } from "../../../api";
import { Star, StarHalf, MapPin, Phone, Clock, Heart, X, ChevronLeft, ChevronRight } from "lucide-react";
import { addFavorite, removeFavoriteByDestinationId, loadFavorites } from "../../../services/favoritesService";

type UIDestination = {
  id?: string;
  name?: string;
  city?: string;
  country?: string;
  category?: string;
  description?: string;
  hero_image_url?: string;
  opening_time?: string | null;
  closing_time?: string | null;
  contact?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  gallery?: Array<{ ordering?: number; url: string; caption?: string | null }>;
  rating?: number | null;
  review_count?: number | null;
  address?: string | null;
};

type UIReview = {
  id?: string;
  author_name?: string;
  rating?: number; // 0..5 รองรับ .5
  comment?: string;
  posted_at?: string; // ISO หรือ human-readable
};

function RatingStars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    <div className="flex items-center gap-1" aria-label={`Rating ${rating}/5`}>
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

function formatTime(t?: string | null) {
  if (!t) return "";
  const [hhStr, mmStr] = t.split(":");
  const hh = parseInt(hhStr!, 10);
  const mm = parseInt(mmStr ?? "0", 10);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return t;
  const period = hh >= 12 ? "p.m." : "a.m.";
  const hour12 = ((hh + 11) % 12) + 1;
  const mm2 = String(mm).padStart(2, "0");
  return `${hour12}:${mm2} ${period}`;
}

function formatDateTimeLocal(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd} ${hh}:${mi}:${ss}`;
}

export default function DestinationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [destination, setDestination] = useState<UIDestination | null>(null);
  const [reviews, setReviews] = useState<UIReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorite, setFavorite] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);

  // Keyboard controls for lightbox (ESC close, arrows navigate)
  useEffect(() => {
    if (!isLightboxOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
      } else if (e.key === "ArrowRight" && (destination?.gallery?.length ?? 0) > 1) {
        setLightboxIndex((i) => ((i + 1) % ((destination?.gallery?.length ?? 0) || 1)));
      } else if (e.key === "ArrowLeft" && (destination?.gallery?.length ?? 0) > 1) {
        setLightboxIndex((i) => (i - 1 + ((destination?.gallery?.length ?? 0) || 1)) % ((destination?.gallery?.length ?? 0) || 1));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isLightboxOpen, destination?.gallery?.length]);

  // Lock document scroll when lightbox is open
  useEffect(() => {
    if (isLightboxOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isLightboxOpen]);

  const descriptionRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const reviewsRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;

  // Derived values must not be placed after conditional returns to keep hook order stable
  const titleText = useMemo(() => {
    const parts = [destination?.name, destination?.city].filter(Boolean) as string[];
    return parts.join(", ");
  }, [destination?.name, destination?.city]);

  // rating: ถ้ามีรีวิวใน state ให้คำนวณจากรีวิวนั้นก่อน
  // หากยังไม่มีรีวิวใน state ให้ใช้ค่าจาก destination (rating/average_rating)
  const ratingValue = useMemo(() => {
    if (reviews.length > 0) {
      const rated = reviews
        .map((r) => r.rating)
        .filter((n): n is number => typeof n === "number");
      if (rated.length === 0) return undefined;
      const avg = rated.reduce((a, b) => a + b, 0) / rated.length;
      return Math.round(avg * 2) / 2; // ปัดเป็นครึ่งดาว
    }
    if (typeof destination?.rating === "number") return destination.rating;
    return undefined;
  }, [reviews, destination?.rating]);

  const reviewCount = useMemo(() => {
    if (reviews.length > 0) return reviews.length;
    if (typeof destination?.review_count === "number") return destination.review_count;
    return undefined;
  }, [reviews, destination?.review_count]);

  useEffect(() => {
    if (!id) {
      setError("No destination ID provided");
      setLoading(false);
      return;
    }

    const safeId = id as string;
    let isCancelled = false;

    async function run() {
      try {
        setLoading(true);

        // --- ดึงรายละเอียดสถานที่ ---
        const rawDest = await getDestinationById(safeId);
        const destPayload = rawDest?.destination ?? rawDest;

        // TODO: map ให้ตรงกับ Swagger ถ้าชื่อฟิลด์ต่าง
        const adapted: UIDestination = {
          id: destPayload?.id ?? destPayload?.uuid,
          name: destPayload?.name,
          city: destPayload?.city ?? destPayload?.address?.city,
          country: destPayload?.country ?? destPayload?.address?.country,
          category: destPayload?.category,
          description: destPayload?.description,
          hero_image_url:
            // Prefer the first gallery image as hero
            destPayload?.gallery?.[0]?.url ??
            destPayload?.hero_image_url ??
            destPayload?.heroImageUrl ??
            destPayload?.cover_url,
          opening_time: destPayload?.opening_time ?? destPayload?.openTime ?? null,
          closing_time: destPayload?.closing_time ?? destPayload?.closeTime ?? null,
          contact: destPayload?.contact ?? destPayload?.phone ?? destPayload?.tel ?? null,
          latitude: destPayload?.latitude ?? destPayload?.lat ?? null,
          longitude: destPayload?.longitude ?? destPayload?.lng ?? null,
          gallery: Array.isArray(destPayload?.gallery)
            ? destPayload.gallery
                .map((g: any, i: number) => ({
                  ordering: g?.ordering ?? i,
                  url: g?.url ?? g?.image_url,
                  caption: g?.caption ?? null,
                }))
                .filter((g: any) => !!g.url)
                .sort((a: any, b: any) => (a.ordering ?? 0) - (b.ordering ?? 0))
            : [],
          rating:
            typeof destPayload?.rating === "number"
              ? destPayload.rating
              : typeof destPayload?.average_rating === "number"
              ? destPayload.average_rating
              : null,
          review_count:
            typeof destPayload?.review_count === "number" ? destPayload.review_count : null,
          address: destPayload?.address?.line ?? destPayload?.address ?? null,
        };

        // --- ดึงรีวิว ---
        const rawReviews = await getDestinationReviewById(safeId);
        const reviewItems = Array.isArray(rawReviews?.reviews)
          ? rawReviews.reviews
          : Array.isArray(rawReviews)
          ? rawReviews
          : [];

        // TODO: map ให้ตรงกับ Swagger ถ้าชื่อฟิลด์ต่าง
        const adaptedReviews: UIReview[] = reviewItems
          .map((r: any) => ({
            id: r?.id ?? r?.review_id,
            author_name:
              r?.reviewer?.display_name ??
              r?.display_name ??
              r?.author_name ??
              r?.user_name ??
              r?.author ??
              "Anonymous",
            rating:
              typeof r?.rating === "number"
                ? r.rating
                : typeof r?.stars === "number"
                ? r.stars
                : undefined,
            comment: r?.comment ?? r?.body ?? r?.text ?? "",
            posted_at: r?.posted_at ?? r?.created_at ?? r?.date,
          }))
          .filter((r: UIReview) => r.comment !== undefined);

        if (!isCancelled) {
          setDestination(adapted);
          setReviews(adaptedReviews);
          setError(null);
        }
      } catch (err) {
        console.error("Error fetching destination:", err);
        if (!isCancelled) setError("Failed to load destination");
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    run();
    return () => {
      isCancelled = true;
    };
  }, [id]);

  // Initialize favorite toggle based on current favorites storage
  useEffect(() => {
    if (!destination?.id) return;
    const list = loadFavorites();
    const isFav = list.some((x) => x.destination_id === destination.id);
    setFavorite(isFav);
  }, [destination?.id]);

  function scrollTo(ref: React.RefObject<HTMLDivElement>) {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ======== สถานะโหลด/ผิดพลาด ========
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#016B71]" />
            <p className="mt-4 text-slate-600">Loading destination...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !destination) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              {error || "Destination not found"}
            </h2>
            <p className="text-slate-600 mb-6">
              The destination you're looking for doesn't exist or has been removed.
            </p>
            <button
              onClick={() => navigate("/")}
              className="rounded-full bg-[#016B71] px-6 py-3 font-bold text-white shadow-md hover:bg-[#01585C] transition"
            >
              Back to Home
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }


  const gallery = (destination.gallery && destination.gallery.length > 0)
    ? destination.gallery
    : (destination.hero_image_url
        ? [{ ordering: 0, url: destination.hero_image_url, caption: destination.name ?? null }]
        : []);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">
        <div className="max-w-5xl mx-auto px-6 py-10">
          {/* Title + Rating */}
          <div className="mb-4">
            <h1 className="text-[22px] font-semibold text-slate-900">
              {titleText || destination.name || ""}
            </h1>

            {(typeof ratingValue === "number" || typeof reviewCount === "number") && (
              <div className="mt-1 flex items-center gap-2 text-sm text-slate-700">
                {typeof ratingValue === "number" && <RatingStars rating={ratingValue} />}
                {typeof ratingValue === "number" && (
                  <span className="leading-none">{ratingValue.toFixed(1)}</span>
                )}
                {typeof reviewCount === "number" && (
                  <span className="text-slate-500">({reviewCount} reviews)</span>
                )}
              </div>
            )}
          </div>

          {/* Gallery (ซ้ายใหญ่ + ขวา 2 รูปซ้อน) */}
          {gallery.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="md:col-span-2">
                <img
                  src={gallery[0]?.url}
                  alt={gallery[0]?.caption ?? "gallery"}
                  className="w-full h-[260px] md:h-[300px] object-cover rounded-xl cursor-zoom-in"
                  loading="lazy"
                  onClick={() => {
                    setLightboxIndex(0);
                    setIsLightboxOpen(true);
                  }}
                />
              </div>
              <div className="grid grid-rows-2 gap-4">
                {gallery[1] && (
                  <img
                    src={gallery[1]?.url}
                    alt={gallery[1]?.caption ?? "gallery"}
                    className="w-full h-[128px] md:h-[140px] object-cover rounded-xl cursor-zoom-in"
                    loading="lazy"
                    onClick={() => {
                      setLightboxIndex(1);
                      setIsLightboxOpen(true);
                    }}
                  />
                )}
                {gallery[2] && (
                  <img
                    src={gallery[2]?.url}
                    alt={gallery[2]?.caption ?? "gallery"}
                    className="w-full h-[128px] md:h-[140px] object-cover rounded-xl cursor-zoom-in"
                    loading="lazy"
                    onClick={() => {
                      setLightboxIndex(2);
                      setIsLightboxOpen(true);
                    }}
                  />
                )}
              </div>
            </div>
          )}

          {/* Tabs + Favorite */}
          <div className="flex items-center justify-between border-b border-slate-200">
            <div className="flex items-center gap-8">
              <button
                onClick={() => scrollTo(descriptionRef)}
                className="py-3 text-[15px] font-medium text-slate-900 relative after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-full after:bg-slate-900"
                aria-label="Go to Description"
              >
                Description
              </button>
              <button
                onClick={() => scrollTo(reviewsRef)}
                className="py-3 text-[15px] font-medium text-slate-500 hover:text-slate-900"
                aria-label="Go to Reviews"
              >
                Reviews
              </button>
            </div>
            <button
              type="button"
              onClick={async () => {
                if (!destination?.id) return;
                const next = !favorite;
                setFavorite(next);
                if (next) {
                  await addFavorite({
                    id: `local:${destination.id}`,
                    destination_id: destination.id,
                    destination: {
                      name: destination.name,
                      city: destination.city ?? undefined,
                      country: destination.country ?? undefined,
                      category: destination.category ?? undefined,
                      hero_image_url: destination.hero_image_url ?? undefined,
                      slug: undefined,
                      contact: destination.contact ?? undefined,
                      // Use computed average and count from this page
                      rating: ratingValue ?? destination.rating ?? undefined,
                      review_count: reviewCount ?? destination.review_count ?? undefined,
                    },
                  });
                } else {
                  await removeFavoriteByDestinationId(destination.id);
                }
              }}
              className="p-2 transition-colors"
              aria-label="Add to favorites"
              aria-pressed={favorite}
              title="Add to favorites"
            >
              <Heart
                className={`h-5 w-5 ${favorite ? "text-rose-500" : "text-slate-800"}`}
                fill={favorite ? "currentColor" : "none"}
                strokeWidth={2}
              />
            </button>
          </div>

          {/* Description */}
          <section ref={descriptionRef} className="pt-6">
            {destination.description && (
              <p className="text-slate-700 leading-7">{destination.description}</p>
            )}

            <div className="mt-8 space-y-6">
              {(destination.address || destination.city || destination.country) && (
                <div className="flex items-start gap-4">
                  <MapPin className="h-5 w-5 mt-0.5" color="#0F172A" strokeWidth={2} aria-hidden />
                  <div>
                    <p className="text-[15px] font-semibold text-slate-900">Location</p>
                    <p className="text-[14px] text-slate-500">
                      {destination.address ||
                        [destination.city, destination.country].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </div>
              )}

              {destination.contact && (
                <div className="flex items-start gap-4">
                  <Phone className="h-5 w-5 mt-0.5" color="#0F172A" strokeWidth={2} aria-hidden />
                  <div>
                    <p className="text-[15px] font-semibold text-slate-900">Contact</p>
                    <p className="text-[14px] text-slate-500">{destination.contact}</p>
                  </div>
                </div>
              )}

              {destination.opening_time && (
                <div className="flex items-start gap-4">
                  <Clock className="h-5 w-5 mt-0.5" color="#0F172A" strokeWidth={2} aria-hidden />
                  <div>
                    <p className="text-[15px] font-semibold text-slate-900">Opening Time</p>
                    <p className="text-[14px] text-slate-500">
                      {formatTime(destination.opening_time)}
                    </p>
                  </div>
                </div>
              )}

              {destination.closing_time && (
                <div className="flex items-start gap-4">
                  <Clock className="h-5 w-5 text-slate-900 mt-0.5" aria-hidden />
                  <div>
                    <p className="text-[15px] font-semibold text-slate-900">Closing Time</p>
                    <p className="text-[14px] text-slate-500">
                      {formatTime(destination.closing_time)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Reviews */}
          <section ref={reviewsRef} className="pt-10">
            <h2 className="text-[18px] font-semibold text-slate-900 mb-4">Reviews</h2>

            {reviews.length === 0 ? (
              <p className="text-slate-500 text-sm">No reviews yet.</p>
            ) : (
              <div className="space-y-8">
                {reviews.map((r, idx) => (
                  <div key={r.id ?? idx}>
                    {typeof r.rating === "number" && <RatingStars rating={r.rating} />}
                    <p className="mt-2 text-[14px] text-slate-900 font-medium">
                      {(r.author_name && r.author_name !== "Anonymous") ? r.author_name : "Anonymous"}
                      {r.posted_at ? ` - ${formatDateTimeLocal(r.posted_at)}` : ""}
                    </p>
                    {r.comment && <p className="mt-3 text-slate-700 leading-7">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsLightboxOpen(false)}
        >
          <img
            src={gallery[lightboxIndex]?.url}
            alt={gallery[lightboxIndex]?.caption ?? destination.name ?? "image"}
            className="max-h-screen max-w-screen object-contain select-none"
            onClick={(e) => e.stopPropagation()}
          />
          {gallery.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((i) => (i - 1 + gallery.length) % gallery.length);
                }}
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
              <button
                type="button"
                aria-label="Next image"
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((i) => (i + 1) % gallery.length);
                }}
              >
                <ChevronRight className="h-7 w-7" />
              </button>
            </>
          )}
          <button
            type="button"
            aria-label="Close image"
            title="Close"
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
            onClick={() => setIsLightboxOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      )}
      <Footer />
    </>
  );
}
