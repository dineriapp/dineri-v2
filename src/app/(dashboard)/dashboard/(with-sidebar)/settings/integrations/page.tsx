"use client";
import {
  useConnectGooglePlaceId,
  useDisconnectGooglePlaceId,
  useGoogleRating,
} from "@/lib/tanstack-react-query/hooks/google-rating";
import { updateSelectedRestaurant, useSelectedRestaurant } from "@/stores/restaurant-store";
import { Check, Loader, MapPin, Plug, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const COMING_SOON = [
  ["google", "Google Business", "Sync reviews and hours."],
  ["meta", "Meta Pixel", "Track conversions on Facebook & Instagram."],
  ["zapier", "Zapier", "Connect Dineri to 5,000+ apps."],
  ["sheets", "Google Sheets", "Export reservations to a sheet."],
] as const;

const Page = () => {
  return (
    <section
      aria-labelledby="settings-panel-title"
      className="dash-card relative rounded-2xl border border-white/5 bg-surface-1 p-4 h-fit sm:p-6"
    >
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-white/5 pb-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white">
            <Plug className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 id="settings-panel-title" className="font-inter-tight text-xl font-semibold">
              Integrations
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Third-party services</p>
          </div>
        </div>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        <GooglePlaceIdCard />
        {COMING_SOON.map(([k, name, desc]) => (
          <div
            key={k}
            className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-background p-3 opacity-60 sm:p-4 xl:flex-row xl:items-start xl:justify-between"
          >
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-surface-2 text-muted-foreground">
                <Plug className="h-4 w-4 shrink-0" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium">{name}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{desc}</div>
              </div>
            </div>
            <span className="inline-flex w-full shrink-0 items-center justify-center rounded-lg bg-white/5 px-3 py-2 text-xs font-semibold text-muted-foreground xl:w-auto xl:py-1.5">
              Coming soon
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

const GooglePlaceIdCard = () => {
  const selectedRestaurant = useSelectedRestaurant();
  const connected = !!selectedRestaurant?.googlePlaceId;
  const [placeIdInput, setPlaceIdInput] = useState(selectedRestaurant?.googlePlaceId ?? "");

  const { data: rating, isPending: ratingPending } = useGoogleRating();
  const connectMutation = useConnectGooglePlaceId();
  const disconnectMutation = useDisconnectGooglePlaceId();

  const handleConnect = () => {
    if (!placeIdInput.trim()) {
      toast.error("Enter a Google Place ID");
      return;
    }
    connectMutation.mutate(placeIdInput, {
      onSuccess: (data) => {
        updateSelectedRestaurant({ googlePlaceId: data.placeId });
        toast.success(`Connected to ${data.name || "your Google Business Profile"}`);
      },
      onError: (err) => toast.error(err.message ?? "Failed to connect"),
    });
  };

  const handleDisconnect = () => {
    disconnectMutation.mutate(undefined, {
      onSuccess: () => {
        updateSelectedRestaurant({ googlePlaceId: null });
        setPlaceIdInput("");
        toast.success("Google Place ID disconnected");
      },
      onError: (err) => toast.error(err.message ?? "Failed to disconnect"),
    });
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-background p-3 sm:col-span-2 sm:p-4">
      <div className="flex min-w-0 items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${connected ? "border-white/30 bg-white/10 text-white" : "border-white/10 bg-surface-2 text-muted-foreground"}`}
        >
          <MapPin className="h-4 w-4 shrink-0" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium">Google Place ID</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            Used to display your live Google review count and average rating on your restaurant
            page.
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={placeIdInput}
          onChange={(e) => setPlaceIdInput(e.target.value)}
          placeholder="e.g. ChIJN1t_tDeuEmsRUsoyG83frY4"
          className="h-9 w-full min-w-0 rounded-lg border border-white/10 bg-surface-2 px-3 text-xs outline-none focus:border-white/40"
        />
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleConnect}
            disabled={connectMutation.isPending}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-white px-3.5 text-xs font-semibold text-background transition hover:bg-white/90 disabled:opacity-50"
          >
            {connectMutation.isPending ? (
              <Loader className="h-3 w-3 animate-spin" />
            ) : connected ? (
              "Update"
            ) : (
              "Connect"
            )}
          </button>
          {connected && (
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={disconnectMutation.isPending}
              className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-white/10 px-3 text-xs text-muted-foreground transition hover:border-white/20 hover:text-foreground disabled:opacity-50"
            >
              Disconnect
            </button>
          )}
        </div>
      </div>

      {connected && (
        <div className="rounded-lg border border-white/10 bg-surface-2 px-3 py-2">
          {ratingPending ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader className="h-3 w-3 animate-spin" /> Fetching live rating…
            </div>
          ) : rating ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/10 px-2 py-0.5 text-white">
                <Check className="h-3 w-3" /> Connected
              </span>
              <span className="inline-flex items-center gap-1 text-foreground">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {rating.rating.toFixed(1)}
              </span>
              <span className="text-muted-foreground">
                · {rating.userRatingCount.toLocaleString()} reviews
              </span>
            </div>
          ) : (
            <div className="text-xs text-warning">
              Couldn&apos;t fetch live data for this Place ID. It may be invalid - try reconnecting.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Page;
