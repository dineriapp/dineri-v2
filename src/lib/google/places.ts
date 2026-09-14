import "server-only";

/**
 * Google Places integration, on Places API (New).
 *
 * The legacy `maps/api/place/details/json` endpoint this used to call rejects
 * any key carrying an HTTP-referrer restriction outright, and Google no longer
 * enables it for projects created after March 2025. The v1 API below is the
 * supported path and is the only one that returns review bodies.
 *
 * `GOOGLE_MAPS_API_KEY` must be a *server* key — restricted by IP, or
 * unrestricted. A referrer-restricted key is for browser calls only and will
 * always 403 here, whatever the place id.
 */

const PLACES_ENDPOINT = "https://places.googleapis.com/v1/places";

/** Cheaper SKUs cover the first three; `reviews` moves the call up a tier. */
const FIELD_MASK = "id,displayName,rating,userRatingCount,googleMapsUri,reviews";

const CACHE_SECONDS = 3600;

export type GoogleReview = {
    id: string;
    rating: number;
    text: string;
    authorName: string;
    authorPhotoUri: string | null;
    authorUri: string | null;
    /** Google's own wording, e.g. "a month ago" — no client-side date maths. */
    relativeTime: string;
    publishedAt: string | null;
};

export type GooglePlaceRating = {
    name: string;
    rating: number;
    userRatingCount: number;
};

export type GooglePlace = GooglePlaceRating & {
    googleMapsUri: string | null;
    reviews: GoogleReview[];
};

type PlacesTextValue = { text?: string; languageCode?: string };

type PlacesReview = {
    name?: string;
    rating?: number;
    text?: PlacesTextValue;
    originalText?: PlacesTextValue;
    relativePublishTimeDescription?: string;
    publishTime?: string;
    authorAttribution?: { displayName?: string; photoUri?: string; uri?: string };
};

type PlacesResponse = {
    id?: string;
    displayName?: PlacesTextValue;
    rating?: number;
    userRatingCount?: number;
    googleMapsUri?: string;
    reviews?: PlacesReview[];
    error?: { code?: number; status?: string; message?: string };
};

/**
 * A rejected key looks identical to "this place has no rating" once the result
 * is `null`, which is how a broken integration stayed invisible. Misconfiguration
 * is logged loudly; a place simply having no reviews is not an error.
 */
function logFailure(placeId: string, status: number, body: PlacesResponse) {
    const reason = body.error?.status ?? `HTTP ${status}`;
    const message = body.error?.message ?? "Unknown error";
    console.error(`Google Places request failed for ${placeId} — ${reason}: ${message}`);
}

function toReview(review: PlacesReview, index: number): GoogleReview | null {
    const text = review.text?.text ?? review.originalText?.text ?? "";
    if (!text) return null;

    return {
        id: review.name ?? `review-${index}`,
        rating: review.rating ?? 0,
        text,
        authorName: review.authorAttribution?.displayName ?? "Google user",
        authorPhotoUri: review.authorAttribution?.photoUri ?? null,
        authorUri: review.authorAttribution?.uri ?? null,
        relativeTime: review.relativePublishTimeDescription ?? "",
        publishedAt: review.publishTime ?? null,
    };
}

/**
 * Rating, review count and up to five reviews for a place. Returns null when the
 * place can't be read — a missing key, a rejected key, an unknown place id, or a
 * place Google holds no rating for.
 */
export async function fetchGooglePlaceRating(placeId: string): Promise<GooglePlace | null> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        console.error("GOOGLE_MAPS_API_KEY is not set — skipping Google Places lookup.");
        return null;
    }

    const trimmed = placeId.trim();
    if (!trimmed) return null;

    try {
        const res = await fetch(`${PLACES_ENDPOINT}/${encodeURIComponent(trimmed)}`, {
            headers: {
                "X-Goog-Api-Key": apiKey,
                "X-Goog-FieldMask": FIELD_MASK,
            },
            next: { revalidate: CACHE_SECONDS },
        });

        const data: PlacesResponse = await res.json();

        if (!res.ok) {
            logFailure(trimmed, res.status, data);
            return null;
        }

        // A place with no ratings yet is a legitimate answer, not a failure.
        if (typeof data.rating !== "number" || typeof data.userRatingCount !== "number") {
            return null;
        }

        return {
            name: data.displayName?.text ?? "",
            rating: data.rating,
            userRatingCount: data.userRatingCount,
            googleMapsUri: data.googleMapsUri ?? null,
            reviews: (data.reviews ?? [])
                .map(toReview)
                .filter((r): r is GoogleReview => r !== null),
        };
    } catch (error) {
        console.error(`Google Places request threw for ${trimmed}:`, error);
        return null;
    }
}
