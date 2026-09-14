import "dotenv/config";

/**
 * Diagnostic for the Google Places integration — run it whenever ratings or
 * reviews stop appearing, before touching any application code.
 *
 *   pnpm google:check                 # Google Sydney, Google's own sample place
 *   pnpm google:check <PLACE_ID>
 *
 * It talks to Google directly rather than going through `fetchGooglePlaceRating`,
 * so a rejected key shows its real reason instead of collapsing to `null`.
 */

const SAMPLE_PLACE_ID = "ChIJN1t_tDeuEmsRUsoyG83frY4";
const FIELD_MASK = "id,displayName,rating,userRatingCount,googleMapsUri,reviews";

const HINTS: Record<string, string> = {
    API_KEY_HTTP_REFERRER_BLOCKED:
        "The key has an HTTP-referrer restriction. Those only apply to browser calls and can never " +
        "authorise a server request. In Google Cloud → Credentials, either drop the restriction or " +
        "issue a separate server key restricted by IP.",
    API_KEY_SERVICE_BLOCKED:
        "The key is restricted to a set of APIs that excludes Places API (New). Add it under the " +
        "key's API restrictions.",
    SERVICE_DISABLED:
        "Places API (New) is not enabled on this project. Enable it in the API Library.",
    PERMISSION_DENIED: "Check the key's restrictions and that billing is active on the project.",
};

async function main() {
    const placeId = process.argv[2] ?? SAMPLE_PLACE_ID;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        console.error("GOOGLE_MAPS_API_KEY is not set in .env");
        process.exit(1);
    }

    console.log(`Key ...${apiKey.slice(-6)} → place ${placeId}\n`);

    const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
        headers: { "X-Goog-Api-Key": apiKey, "X-Goog-FieldMask": FIELD_MASK },
    });
    const body = await res.json();
    if (!res.ok) {
        const reason: string = body?.error?.details?.[0]?.reason ?? body?.error?.status ?? "";
        console.error(`FAILED — HTTP ${res.status} ${body?.error?.status ?? ""}`);
        console.error(body?.error?.message ?? JSON.stringify(body, null, 2));
        const hint = HINTS[reason] ?? HINTS[body?.error?.status ?? ""];
        if (hint) console.error(`\n→ ${hint}`);
        process.exit(1);
    }

    console.log(`OK — ${body.displayName?.text ?? "(no name)"}`);
    console.log(`   rating       : ${body.rating ?? "none"}`);
    console.log(`   ratingCount  : ${body.userRatingCount ?? 0}`);
    console.log(`   mapsUri      : ${body.googleMapsUri ?? "none"}`);
    console.log(`   reviews      : ${body.reviews?.length ?? 0}`);

    for (const review of body.reviews ?? []) {
        const author = review.authorAttribution?.displayName ?? "Google user";
        const when = review.relativePublishTimeDescription ?? "";
        const text: string = review.text?.text ?? review.originalText?.text ?? "";
        console.log(`\n   ${review.rating}★  ${author} · ${when}`);
        console.log(`   ${text.slice(0, 160)}${text.length > 160 ? "…" : ""}`);
    }

    process.exit(0);
}

main().catch((error) => {
    console.error("Request threw:", error);
    process.exit(1);
});
