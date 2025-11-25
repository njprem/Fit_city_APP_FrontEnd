// src/pages/Traveler/Destination/DestinationDetailPage.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Navbar from "../../../components/navbar";
import Footer from "../../../components/footer";
import {
  getDestination,
  getDestinationReviews,
  createDestinationReview,
  deleteDestinationReview,
  getDestinationViews,
} from "../../../services/auth/destinationService";
import { Star, StarHalf, MapPin, Phone, Clock, Heart, X, ChevronLeft, ChevronRight, Pencil, Trash2, Eye } from "lucide-react";
import { addFavorite, removeFavoriteByDestinationId, loadFavorites } from "../../../services/favoritesService";
import { getToken, getUser } from "../../../services/auth/authService";
import type { AuthUser } from "../../../services/auth/authService";
import type { Destination, DestinationResponse, GalleryImage } from "../../../types/destination";

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

type DestinationPayload = Destination & {
  uuid?: string;
  openTime?: string;
  closeTime?: string;
  phone?: string;
  tel?: string;
  lat?: number;
  lng?: number;
  heroImageUrl?: string;
  cover_url?: string;
  review_count?: number;
  rating?: number;
  gallery?: Array<GalleryImage | Record<string, unknown>>;
  address?: {
    line?: string;
    city?: string;
    country?: string;
  } | string;
};

const isDestinationResponsePayload = (
  payload: DestinationResponse | Destination
): payload is DestinationResponse => {
  return typeof payload === "object" && payload !== null && "destination" in payload;
};

const toDestinationPayload = (payload: DestinationResponse | Destination): DestinationPayload => {
  return (isDestinationResponsePayload(payload) ? payload.destination : payload) as DestinationPayload;
};

type ReviewMedia = {
  id?: string;
  url: string;
  ordering?: number;
};

type UIReview = {
  id?: string;
  author_name?: string;
  author_username?: string;
  author_id?: string;
  author_email?: string;
  rating?: number; // 0..5 รองรับ .5
  title?: string;
  content?: string;
  comment?: string;
  posted_at?: string; // ISO หรือ human-readable
  media?: ReviewMedia[];
};

type UserMatchProfile = {
  ids: Set<string>;
  emails: Set<string>;
  usernames: Set<string>;
  fallbackNames: Set<string>;
  allowNameFallback: boolean;
};

const USER_ID_KEYS = ["id", "user_id", "userId", "uuid", "sub", "profile_id"];
const USER_EMAIL_KEYS = ["email", "user_email"];
const USER_USERNAME_KEYS = ["username", "user_name", "userName", "preferred_username"];
const USER_DISPLAY_NAME_KEYS = [
  "display_name",
  "displayName",
  "full_name",
  "fullName",
  "name",
];
const USER_GIVEN_NAME_KEYS = ["firstName", "given_name"];
const USER_FAMILY_NAME_KEYS = ["lastName", "family_name"];

function optionalString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number") return String(value);
  return undefined;
}

function normalizeValue(value: unknown): string | undefined {
  const str = optionalString(value);
  if (!str) return undefined;
  return str.trim().toLowerCase();
}

function collectNormalizedValues(
  record: Record<string, unknown>,
  keys: string[]
): string[] {
  return keys
    .map((key) => normalizeValue(record[key]))
    .filter((value): value is string => Boolean(value));
}

function buildUserMatchProfile(user: AuthUser | null): UserMatchProfile | null {
  if (!user) return null;
  const record = (user as Record<string, unknown>) ?? {};
  const ids = collectNormalizedValues(record, USER_ID_KEYS);
  const emails = collectNormalizedValues(record, USER_EMAIL_KEYS);
  const usernames = collectNormalizedValues(record, USER_USERNAME_KEYS);
  const names = collectNormalizedValues(record, USER_DISPLAY_NAME_KEYS);

  const firstName =
    USER_GIVEN_NAME_KEYS.map((key) => normalizeValue(record[key])).find(Boolean) ??
    undefined;
  const lastName =
    USER_FAMILY_NAME_KEYS.map((key) => normalizeValue(record[key])).find(Boolean) ??
    undefined;
  if (firstName && lastName) {
    names.push(`${firstName} ${lastName}`.trim());
  }
  if (firstName) names.push(firstName);
  if (lastName) names.push(lastName);

  const allowNameFallback = ids.length === 0 && emails.length === 0 && usernames.length === 0;

  if (!ids.length && !emails.length && !usernames.length && !names.length) return null;
  return {
    ids: new Set(ids),
    emails: new Set(emails),
    usernames: new Set(usernames),
    fallbackNames: new Set(names),
    allowNameFallback,
  };
}

function reviewBelongsToUser(
  review: UIReview,
  profile: UserMatchProfile | null
): boolean {
  if (!profile) return false;
  const reviewIds = [normalizeValue(review.author_id)];
  if (reviewIds.some((id) => id && profile.ids.has(id))) {
    return true;
  }
  const reviewEmails = [normalizeValue(review.author_email)];
  if (reviewEmails.some((email) => email && profile.emails.has(email))) {
    return true;
  }
  const reviewUsernames = [normalizeValue(review.author_username)];
  if (reviewUsernames.some((username) => username && profile.usernames.has(username))) {
    return true;
  }
  if (!profile.allowNameFallback) return false;
  const reviewNames = [normalizeValue(review.author_name)];
  return reviewNames.some((name) => name && profile.fallbackNames.has(name));
}

function findExistingReviewForUser(
  reviews: UIReview[],
  user: AuthUser | null
): UIReview | undefined {
  const profile = buildUserMatchProfile(user);
  if (!profile) return undefined;
  return reviews.find((review) => reviewBelongsToUser(review, profile));
}

function adaptReviewMedia(mediaList: unknown): ReviewMedia[] {
  if (!Array.isArray(mediaList)) return [];
  const normalized: ReviewMedia[] = [];
  mediaList.forEach((item, index) => {
    if (!item || typeof item !== "object") return;
    const record = item as Record<string, unknown>;
    const url =
      optionalString(record.url) ??
      optionalString(record.image_url) ??
      optionalString(record.path);
    if (!url) return;
    normalized.push({
      id: optionalString(record.id),
      url,
      ordering: typeof record.ordering === "number" ? record.ordering : index,
    });
  });
  return normalized.sort((a, b) => (a.ordering ?? 0) - (b.ordering ?? 0));
}

function adaptReviewItems(raw: unknown): UIReview[] {
  const reviewsArray: Record<string, unknown>[] = Array.isArray(
    (raw as { reviews?: unknown[] })?.reviews
  )
    ? ((raw as { reviews?: unknown[] }).reviews as Record<string, unknown>[])
    : Array.isArray(raw)
    ? (raw as Record<string, unknown>[])
    : [];

  return reviewsArray
    .map((record) => {
      const reviewer = (record.reviewer as Record<string, unknown>) ?? {};
      const authorName =
        optionalString(reviewer.display_name) ??
        optionalString(reviewer.full_name) ??
        optionalString(reviewer.name) ??
        optionalString(reviewer.username) ??
        optionalString(record.reviewer_name) ??
        optionalString(record.display_name) ??
        optionalString(record.author_name) ??
        optionalString(record.user_name) ??
        optionalString(record.author) ??
        "Anonymous";
      const authorUsername =
        optionalString(reviewer.username) ??
        optionalString(reviewer.user_name) ??
        optionalString(record.author_username) ??
        optionalString(record.user_name) ??
        optionalString(record.username);
      const ratingValue =
        typeof record.rating === "number"
          ? record.rating
          : typeof record.stars === "number"
          ? record.stars
          : undefined;
      const uiReview: UIReview = {
        id: optionalString(record.id) ?? optionalString(record.review_id),
        author_name: authorName,
        author_username: authorUsername,
        author_id:
          optionalString(reviewer.id) ??
          optionalString(reviewer.user_id) ??
          optionalString(record.user_id) ??
          optionalString(record.author_id) ??
          optionalString(record.reviewer_id),
        author_email:
          optionalString(reviewer.email) ??
          optionalString(reviewer.user_email) ??
          optionalString(record.email) ??
          optionalString(record.author_email),
        rating: ratingValue,
        title: optionalString(record.title) ?? undefined,
        content:
          optionalString(record.content) ??
          optionalString(record.comment) ??
          optionalString(record.body) ??
          optionalString(record.text) ??
          "",
        comment:
          optionalString(record.comment) ??
          optionalString(record.body) ??
          optionalString(record.text) ??
          optionalString(record.content) ??
          "",
        posted_at: optionalString(record.posted_at) ?? optionalString(record.created_at) ?? optionalString(record.date),
        media: adaptReviewMedia(record.media),
      };
      return uiReview;
    })
    .filter(
      (review) =>
        review.title !== undefined || review.content !== undefined || review.comment !== undefined
    );
}

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
  const location = useLocation();

  const [destination, setDestination] = useState<UIDestination | null>(null);
  const [reviews, setReviews] = useState<UIReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    const token = getToken();
    const user = getUser();
    return token && user ? user : null;
  });
  const [favorite, setFavorite] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);
  // Review media lightbox
  const [isReviewMediaOpen, setIsReviewMediaOpen] = useState(false);
  const [reviewMediaIndex, setReviewMediaIndex] = useState<number>(0);
  const [reviewMediaList, setReviewMediaList] = useState<ReviewMedia[]>([]);
  const [existingReviewMedia, setExistingReviewMedia] = useState<ReviewMedia[]>([]);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState<number | null>(null);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewDeleting, setReviewDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [viewCount, setViewCount] = useState<number | null>(null);

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

  // Keyboard controls for review media lightbox
  useEffect(() => {
    if (!isReviewMediaOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsReviewMediaOpen(false);
      } else if (e.key === "ArrowRight" && reviewMediaList.length > 1) {
        setReviewMediaIndex((i) => (i + 1) % reviewMediaList.length);
      } else if (e.key === "ArrowLeft" && reviewMediaList.length > 1) {
        setReviewMediaIndex((i) => (i - 1 + reviewMediaList.length) % reviewMediaList.length);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isReviewMediaOpen, reviewMediaList.length]);

  // Lock document scroll when review media lightbox is open
  useEffect(() => {
    if (isReviewMediaOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isReviewMediaOpen]);

  // Lock document scroll when review modal is open
  useEffect(() => {
    if (isReviewOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isReviewOpen]);

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

  const userReview = useMemo(() => {
    if (!authUser) return undefined;
    return findExistingReviewForUser(reviews, authUser);
  }, [reviews, authUser]);

  useEffect(() => {
    if (!userReview) {
      setDeleteError(null);
    }
  }, [userReview]);

  useEffect(() => {
    const syncAuth = () => {
      const token = getToken();
      const user = getUser();
      setAuthUser(token && user ? user : null);
    };

    window.addEventListener("storage", syncAuth);
    window.addEventListener("authChanged", syncAuth);
    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("authChanged", syncAuth);
    };
  }, []);

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
        const rawDest = (await getDestination(safeId)) as DestinationResponse | Destination;
        const destPayload = toDestinationPayload(rawDest);
        const addressRecord =
          typeof destPayload.address === "object" && destPayload.address !== null
            ? (destPayload.address as { line?: string; city?: string; country?: string })
            : undefined;

        // TODO: map ให้ตรงกับ Swagger ถ้าชื่อฟิลด์ต่าง
        const adapted: UIDestination = {
          id: destPayload?.id ?? destPayload?.uuid,
          name: destPayload?.name,
          city: destPayload?.city ?? addressRecord?.city,
          country: destPayload?.country ?? addressRecord?.country,
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
          gallery: (() => {
            if (!Array.isArray(destPayload.gallery)) {
              return [];
            }
            const galleryItems: Array<{ ordering?: number; url: string; caption?: string | null }> = [];
            destPayload.gallery.forEach((item, index) => {
              if (!item || typeof item !== "object") return;
              const record = item as Partial<GalleryImage> & Record<string, unknown>;
              const url = record.url ?? optionalString(record.image_url);
              if (!url) return;
              galleryItems.push({
                ordering: typeof record.ordering === "number" ? record.ordering : index,
                url,
                caption: optionalString(record.caption) ?? null,
              });
            });
            return galleryItems.sort((a, b) => (a.ordering ?? 0) - (b.ordering ?? 0));
          })(),
          rating:
            typeof destPayload?.rating === "number"
              ? destPayload.rating
              : typeof destPayload?.average_rating === "number"
              ? destPayload.average_rating
              : null,
          review_count:
            typeof destPayload.review_count === "number" ? destPayload.review_count : null,
          address:
            addressRecord?.line ??
            (typeof destPayload.address === "string" ? optionalString(destPayload.address) ?? null : null),
        };

        // --- ดึงรีวิว ---
        const rawReviews = await getDestinationReviews(safeId);
        const adaptedReviews = adaptReviewItems(rawReviews);
        try {
          const views = await getDestinationViews(safeId, "all");
          const totalViews =
            (views.views?.all ?? views.views?.all_time)?.total_views ??
            Object.values(views.views ?? {}).find((v) => typeof v?.total_views === "number")?.total_views ??
            null;
          setViewCount(typeof totalViews === "number" && !Number.isNaN(totalViews) ? totalViews : null);
        } catch (err) {
          console.error("Failed to load destination views", err);
          setViewCount(null);
        }

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
    const token = getToken();
    const user = getUser();
    if (!token || !user) {
      setFavorite(false);
      return;
    }
    const list = loadFavorites();
    const isFav = list.some((x) => x.destination_id === destination.id);
    setFavorite(isFav);
  }, [destination?.id]);

  function scrollTo(ref: React.RefObject<HTMLDivElement>) {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function prefillReviewForm(user: AuthUser | null, existing?: UIReview) {
    const targetReview = existing ?? findExistingReviewForUser(reviews, user);
    if (targetReview) {
      setReviewRating(targetReview.rating ?? null);
      setReviewTitle(targetReview.title ?? "");
      setReviewContent(targetReview.content ?? targetReview.comment ?? "");
      setExistingReviewMedia(targetReview.media ?? []);
    } else {
      setReviewRating(null);
      setReviewTitle("");
      setReviewContent("");
      setExistingReviewMedia([]);
    }
  }

  async function handleDeleteOwnReview() {
    if (!destination?.id || !userReview?.id || reviewDeleting) return;
    const token = getToken();
    const user = getUser();
    if (!token || !user) {
      navigate("/unauthorized", { replace: false, state: { from: location } });
      return;
    }

    setReviewDeleting(true);
    setDeleteError(null);
    try {
      await deleteDestinationReview(destination.id, userReview.id);
      const rawReviews = await getDestinationReviews(destination.id);
      const adaptedReviews = adaptReviewItems(rawReviews);
      setReviews(adaptedReviews);
      setExistingReviewMedia([]);
      setReviewImages([]);
      setReviewRating(null);
      setReviewTitle("");
      setReviewContent("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete review";
      setDeleteError(message);
    } finally {
      setReviewDeleting(false);
    }
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
            <button type='button'
              onClick={() => navigate("/")}
              className="rounded-full bg-[#016B71] px-6 py-3 font-bold text-white shadow-md hover:bg-[#01585C] transition"
            >
              Back to Home
            </button>
            <div className="mt-3">
              <button
                type="button"
                onClick={() => navigate("/search")}
                className="rounded-full border border-[#016B71] px-6 py-3 font-bold text-[#016B71] hover:bg-[#016B71] hover:text-white transition"
              >
                Go to Search
              </button>
            </div>
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
              <div className="mt-1 flex items-center gap-3 text-sm text-slate-700 flex-wrap">
                {typeof ratingValue === "number" && <RatingStars rating={ratingValue} />}
                {typeof ratingValue === "number" && (
                  <span className="leading-none">{ratingValue.toFixed(1)}</span>
                )}
                {typeof reviewCount === "number" && (
                  <span className="text-slate-500">({reviewCount} reviews)</span>
                )}
                {typeof viewCount === "number" && (
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <Eye className="w-4 h-4" />
                    <span>{viewCount.toLocaleString()} views</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Gallery (ซ้ายใหญ่ + ขวา 2 รูปซ้อน) */}
          {gallery.length > 0 && (
            <div
              className={`grid grid-cols-1 ${
                gallery.length > 1 ? "md:grid-cols-3" : "md:grid-cols-1"
              } gap-4 mb-8`}
            >
              <div className={gallery.length > 1 ? "md:col-span-2" : "md:col-span-3"}>
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
              {gallery.length > 1 && (
                <div
                  className={`grid gap-4 ${
                    gallery.length > 2 ? "grid-rows-2" : "grid-rows-1"
                  }`}
                >
                  {gallery.slice(1, 3).map((image, idx) => (
                    <img
                      key={image?.url ?? idx}
                      src={image?.url}
                      alt={image?.caption ?? "gallery"}
                      className={`w-full ${
                        gallery.length === 2 ? "h-[260px] md:h-[300px]" : "h-32 md:h-[140px]"
                      } object-cover rounded-xl cursor-zoom-in`}
                      loading="lazy"
                      onClick={() => {
                        setLightboxIndex(idx + 1);
                        setIsLightboxOpen(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tabs + Favorite */}
          <div className="flex items-center justify-between border-b border-slate-200">
            <div className="flex items-center gap-8">
              <button type='button'
                onClick={() => scrollTo(descriptionRef)}
                className="py-3 text-[15px] font-medium text-slate-900 relative after:absolute after:left-0 after:bottom-0 after:h-0.5 after:w-full after:bg-slate-900"
                aria-label="Go to Description"
              >
                Description
              </button>
              <button type='button'
                onClick={() => scrollTo(reviewsRef)}
                className="py-3 text-[15px] font-medium text-slate-500 hover:text-slate-900"
                aria-label="Go to Reviews"
              >
                Reviews
              </button>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-4">
                {userReview && (
                  <button
                    type="button"
                    onClick={handleDeleteOwnReview}
                    className="inline-flex items-center gap-2 text-[14px] font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-50"
                    aria-label="Delete your review"
                    title="Delete your review"
                    disabled={reviewDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const token = getToken();
                    const user = getUser();
                    if (!token || !user) {
                      navigate("/unauthorized", { replace: false, state: { from: location } });
                      return;
                    }
                    prefillReviewForm(user, userReview);
                    setReviewError(null);
                    setDeleteError(null);
                    setReviewImages([]);
                    setIsReviewOpen(true);
                  }}
                  className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#5d5d5d] hover:text-[#01585C]"
                  aria-label="Write a review"
                  title="Write a review"
                >
                  <Pencil className="h-4 w-4" />
                  Review
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!destination?.id) return;
                    const token = getToken();
                    const user = getUser();
                    if (!token || !user) {
                      navigate("/unauthorized", { replace: false, state: { from: location } });
                      return;
                    }
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
              {deleteError && (
                <p className="text-xs text-rose-600">
                  {deleteError}
                </p>
              )}
            </div>
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
            <h2 className="text-[16px] font-semibold text-slate-900 mb-4">Reviews</h2>

            {reviews.length === 0 ? (
              <p className="text-slate-500 text-sm">No reviews.</p>
            ) : (
              <div className="space-y-8">
                {reviews.map((r, idx) => (
                  <div key={r.id ?? idx}>
                    {typeof r.rating === "number" && <RatingStars rating={r.rating} />}
                    <p className="mt-2 text-[14px] text-slate-900 font-medium">
                      {(r.author_name && r.author_name !== "Anonymous") ? r.author_name : "Anonymous"}
                      {r.posted_at ? ` - ${formatDateTimeLocal(r.posted_at)}` : ""}
                    </p>
                    {r.title && (
                      <p className="mt-1 text-[14px] text-slate-900 font-semibold">{r.title}</p>
                    )}
                    {(r.content ?? r.comment) && (
                      <p className="mt-1 text-slate-700 leading-7">{r.content ?? r.comment}</p>
                    )}
                    {Array.isArray(r.media) && r.media.length > 0 && (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {r.media.map((m, mi) => (
                          <button
                            key={m.id ?? mi}
                            type="button"
                            className="block focus:outline-none"
                            onClick={() => {
                              setReviewMediaList(r.media!.map(({ id, url }) => ({ id, url })));
                              setReviewMediaIndex(mi);
                              setIsReviewMediaOpen(true);
                            }}
                            aria-label="View review image"
                          >
                            <img
                              src={m.url}
                              alt={r.title || `review media ${mi + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                              loading="lazy"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Review button */}
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
      {isReviewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsReviewOpen(false)}
        >
          <div
            className="relative max-w-xl w-full mx-4 rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4">
              <p className="text-center text-[16px] font-semibold text-slate-900">{destination.name}</p>
              <p className="mt-2 text-slate-700 font-medium">
                {(getUser()?.display_name as string) || (getUser()?.full_name as string) || (getUser()?.fullName as string) || (getUser()?.username as string) || (getUser()?.name as string) || ""}
              </p>
            </div>

            <div className="flex items-center gap-2 mb-4">
              {Array.from({ length: 5 }).map((_, i) => {
                const value = i + 1;
                const active = (reviewRating ?? 0) >= value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-label={`Rate ${value}`}
                    className="p-1"
                    onClick={() => setReviewRating(value)}
                  >
                    <Star
                      className={`h-6 w-6 ${active ? "text-yellow-500" : "text-slate-400"}`}
                      strokeWidth={2}
                      fill={active ? "currentColor" : "none"}
                    />
                  </button>
                );
              })}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">Title (optional)</label>
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  placeholder="Summary of your review"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Your review</label>
                <textarea
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 h-28 resize-vertical focus:outline-none focus:ring-2 focus:ring-teal-600"
                  placeholder="Share details of your experience"
                />
                {/* Content optional */}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Images (optional)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setReviewImages(Array.from(e.target.files ?? []))}
                  className="mt-1 block w-full text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-200"
                />
                {reviewImages.length > 0 && (
                  <p className="mt-1 text-xs text-slate-500">Selected {reviewImages.length} image(s)</p>
                )}
                {existingReviewMedia.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-slate-500">Photos you've already shared</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {existingReviewMedia.map((media, index) => (
                        <button
                          type="button"
                          key={media.id ?? `${media.url}-${index}`}
                          className="h-20 w-20 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-600"
                          onClick={() => {
                            setReviewMediaList(existingReviewMedia);
                            setReviewMediaIndex(index);
                            setIsReviewMediaOpen(true);
                          }}
                          title="Preview photo"
                        >
                          <img
                            src={media.url}
                            alt="Existing review media"
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">
                      Existing photos remain attached until you submit new ones.
                    </p>
                  </div>
                )}
              </div>
              {reviewError && <p className="text-sm text-rose-600">{reviewError}</p>}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100"
                  onClick={() => setIsReviewOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-5 py-2 rounded-lg bg-[#016B71] text-white font-semibold disabled:opacity-50"
                  disabled={reviewSubmitting || !reviewRating}
                  onClick={async () => {
                    if (!id) return;
                    if (!reviewRating) {
                      setReviewError("Please add rating.");
                      return;
                    }
                    const token = getToken();
                    const user = getUser();
                    if (!token || !user) {
                      setIsReviewOpen(false);
                      navigate("/unauthorized", { replace: false, state: { from: location } });
                      return;
                    }
                    try {
                      setReviewSubmitting(true);
                      setReviewError(null);
                      setDeleteError(null);
                      const existing = findExistingReviewForUser(reviews, user);
                      if (existing?.id) {
                        await deleteDestinationReview(id, existing.id);
                        setExistingReviewMedia([]);
                      }
                      await createDestinationReview(id, {
                        rating: reviewRating,
                        title: reviewTitle.trim() || undefined,
                        content: reviewContent.trim() || undefined,
                        images: reviewImages,
                      });
                      // refresh reviews
                      const rawReviews = await getDestinationReviews(id);
                      const adaptedReviews = adaptReviewItems(rawReviews);
                      setReviews(adaptedReviews);
                      setReviewImages([]);
                      setReviewRating(null);
                      setReviewTitle("");
                      setReviewContent("");
                      setIsReviewOpen(false);
                    } catch (err: unknown) {
                      const message = err instanceof Error ? err.message : "Failed to submit review";
                      setReviewError(message);
                    } finally {
                      setReviewSubmitting(false);
                    }
                  }}
                >
                  {reviewSubmitting ? "Submitting..." : "Post review"}
                </button>
              </div>
            </div>

            <button
              type="button"
              aria-label="Close"
              className="absolute top-3 right-3 p-2"
              onClick={() => setIsReviewOpen(false)}
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>
        </div>
      )}
      {isReviewMediaOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsReviewMediaOpen(false)}
        >
          <img
            src={reviewMediaList[reviewMediaIndex]?.url}
            alt="review media"
            className="max-h-screen max-w-screen object-contain select-none"
            onClick={(e) => e.stopPropagation()}
          />
          {reviewMediaList.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setReviewMediaIndex((i) => (i - 1 + reviewMediaList.length) % reviewMediaList.length);
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
                  setReviewMediaIndex((i) => (i + 1) % reviewMediaList.length);
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
            onClick={() => setIsReviewMediaOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      )}
      <Footer />
    </>
  );
}
