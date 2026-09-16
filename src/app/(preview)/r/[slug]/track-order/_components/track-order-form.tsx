"use client";

import { AlertCircle, ArrowRight, Loader2, Mail, Search, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { trackOrderAction } from "../actions";

import { venuePath } from "@/lib/venue-url";
type Props = {
  slug: string;
  restaurantName: string;
};

export default function TrackOrderForm({ slug, restaurantName }: Props) {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setError(null);
    setSubmitting(true);
    try {
      const result = await trackOrderAction({ slug, orderNumber, email });
      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push(`${venuePath(slug, "/menu/order/success")}?order_id=${result.data.orderId}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-linear-to-b from-zinc-50 to-zinc-100 px-4 py-10 text-zinc-900">
      <div className="mx-auto w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg shadow-zinc-900/10">
            <Search className="h-7 w-7" />
          </div>
          <h1 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">Track your order</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500">
            Enter your order number and the email you used at {restaurantName} to see its status.
          </p>
        </div>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-900/5 sm:p-8"
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="orderNumber"
                className="mb-1.5 block text-xs font-medium text-zinc-600"
              >
                Order number
              </label>
              <div className="relative">
                <UtensilsCrossed className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  id="orderNumber"
                  name="orderNumber"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="ORD-1042"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  required
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-zinc-400">
                Found on your receipt or confirmation email.
              </p>
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-zinc-600">
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-xs text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Looking up your order…
              </>
            ) : (
              <>
                Track order <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Actions */}
        <div className="mt-5 text-center">
          <Link
            href={venuePath(slug, "/menu")}
            className="text-xs font-medium text-zinc-500 transition hover:text-zinc-700"
          >
            Back to menu
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-zinc-400">
          Powered by{" "}
          <a
            href="https://www.dineri.app"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-zinc-500 hover:text-zinc-700"
          >
            Dineri
          </a>
        </div>
      </div>
    </main>
  );
}
