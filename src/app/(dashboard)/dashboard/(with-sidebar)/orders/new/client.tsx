"use client";
import { MenuPageRestaurantType } from "@/app/(preview)/r/[slug]/menu/query";
import { getCurrencySymbol } from "@/lib/stripe/types";
import { Addon } from "@/lib/types";
import { RestaurantOrderSettings } from "@/lib/types/order";
import {
  addToCart,
  clearCart,
  pruneInvalidCartItems,
  removeCartItem,
  updateCartItemQuantity,
  useCartStore,
} from "@/stores/cart-store";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Utensils,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { processOrderAdmin } from "./actions";

const EMPTY_CART: CartItem[] = [];

const checkoutSchema = z.object({
  name: z.string().trim().min(2, "Name required").max(80),
  phone: z.string().trim().min(6, "Phone required").max(30),
  email: z.string().trim().email("Invalid email").max(255),
  location: z.string().trim().min(3, "Address / location required").max(200),
  fulfillment: z.enum(["pickup", "delivery"]),
  paymentMethod: z.enum(["cash", "card"]),
});

type CartItem = {
  id: string;
  addons: Addon[];
  quantity: number;
  customization?: string;
};

type DetailType = {
  name: string;
  phone: string;
  email: string;
  location: string;
  fulfillment: "pickup" | "delivery";
  paymentMethod: "cash" | "card";
};

const CreateOrderPage = ({ restaurant }: { restaurant: NonNullable<MenuPageRestaurantType> }) => {
  const isStripeConfigured = restaurant?.stripe?.configured ?? false;
  const orderSettings = restaurant.orderSettings;
  const currency = getCurrencySymbol(restaurant.stripe?.currency);

  const router = useRouter();
  const [cat, setCat] = useState(restaurant?.menu_categories?.[0]?.id ?? "");
  const [searchQuery, setSearchQuery] = useState("");
  const cart = useCartStore((state) => state.carts[restaurant.slug] ?? EMPTY_CART);

  const [details, setDetails] = useState<DetailType>({
    name: "",
    phone: "",
    email: "",
    location: "",
    fulfillment: "pickup",
    paymentMethod: "cash",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paying, setPaying] = useState(false);
  const [thankYou, setThankYou] = useState(false);
  const [customization, setCustomization] = useState("");

  const [checkoutStep, setCheckoutStep] = useState<"cart" | "details">("cart");
  const [addonModal, setAddonModal] = useState<{ item: (typeof allItems)[0] } | null>(null);
  const [selectedAddonIndices, setSelectedAddonIndices] = useState<number[]>([]);
  const [modalQuantity, setModalQuantity] = useState(1);

  const allItems = useMemo(
    () => restaurant?.menu_categories.flatMap((category) => category.items) ?? [],
    [restaurant],
  );

  useEffect(() => {
    const removed = pruneInvalidCartItems(
      restaurant.slug,
      allItems.map((i) => i.id),
    );
    if (removed.length > 0) {
      toast.error(
        removed.length === 1
          ? "An item in this cart is no longer available and was removed."
          : `${removed.length} items in this cart are no longer available and were removed.`,
      );
    }
  }, [allItems, restaurant.slug]);

  // Compute totals
  const totals = useMemo(() => {
    let subtotal = 0;
    let count = 0;
    const items = cart
      .map((cartItem) => {
        const item = allItems.find((i) => i.id === cartItem.id);
        if (!item) return null;
        const itemPrice = Number(item.price);
        const addonTotal = cartItem.addons.reduce((sum, a) => sum + Number(a.price), 0);
        const totalPerItem = (itemPrice + addonTotal) * cartItem.quantity;
        // eslint-disable-next-line react-hooks/immutability
        subtotal += totalPerItem;
        count += cartItem.quantity;
        return { item, ...cartItem };
      })
      .filter(
        (
          x,
        ): x is {
          item: (typeof allItems)[number];
          id: string;
          addons: Addon[];
          quantity: number;
        } => x !== null,
      );
    return { items, subtotal, count };
  }, [cart, allItems]);

  const finalTotal = useMemo(() => {
    const subtotal = totals.subtotal;
    const isDelivery = details.fulfillment === "delivery";
    const deliveryFee = isDelivery ? Number(orderSettings?.deliveryFee ?? 0) : 0;
    const taxRate = Number(orderSettings?.taxRate ?? 0);
    const tax = (subtotal * taxRate) / 100;
    return subtotal + deliveryFee + tax;
  }, [totals.subtotal, details.fulfillment, orderSettings]);

  const validateCheckout = (): string | null => {
    if (!isStripeConfigured && details.paymentMethod === "card") {
      return "Card payments are not configured. Please use cash or contact the restaurant.";
    }
    return null;
  };

  const totalQuantityForItem = (itemId: string) => {
    return cart.filter((c) => c.id === itemId).reduce((sum, c) => sum + c.quantity, 0);
  };

  const addToCartL = (
    itemId: string,
    addons: Addon[],
    quantity: number,
    customization?: string,
  ) => {
    addToCart(restaurant.slug, { id: itemId, addons, quantity, customization });
  };

  const updateQty = (index: number, delta: number) => {
    updateCartItemQuantity(restaurant.slug, index, delta);
  };

  const removeItem = (index: number) => {
    removeCartItem(restaurant.slug, index);
  };

  const openAddonModal = (item: (typeof allItems)[0]) => {
    setAddonModal({ item });
    setSelectedAddonIndices([]);
    setModalQuantity(1);
    setCustomization("");
  };

  const closeAddonModal = () => {
    setAddonModal(null);
  };

  const confirmAddToCart = () => {
    if (!addonModal) return;
    const { item } = addonModal;
    const selectedAddons = selectedAddonIndices.map(
      (idx) => item.addons?.[idx] || { label: "", price: 0 },
    );
    addToCartL(item.id, selectedAddons, modalQuantity, customization.trim() || undefined);
    closeAddonModal();
  };

  const visibleItems = useMemo(() => {
    const categoryItems = restaurant?.menu_categories.find((c) => c.id === cat)?.items ?? [];
    if (!searchQuery.trim()) return categoryItems;
    const q = searchQuery.toLowerCase().trim();
    return categoryItems.filter(
      (item) => item.name.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q),
    );
  }, [cat, restaurant, searchQuery]);

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateCheckout();
    if (error) {
      toast.error(error);
      return;
    }
    const parsed = checkoutSchema.safeParse(details);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        errs[i.path[0] as string] = i.message;
      });
      setErrors(errs);
      return;
    }
    setErrors({});
    setPaying(true);

    const validCart = cart.filter((c) => allItems.some((i) => i.id === c.id));

    const response = await processOrderAdmin({
      cart: validCart,
      ...details,
      restaurantId: restaurant.id,
    });

    if (!response.success) {
      toast.error(response.error);
      setPaying(false);
      return;
    }

    if (response.data?.url) {
      window.location.href = response.data.url;
      return;
    }
    setPaying(false);
    setThankYou(true);
    clearCart(restaurant.slug);
    toast.success("Order placed!", { description: "Pay upon pickup." });
  };

  return (
    <div className="min-h-screen bg-surface-0 font-sans antialiased">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-surface-1/80 backdrop-blur">
        <div className=" flex  items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/orders"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-white/20 hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to orders
            </Link>
            <span className="text-sm text-muted-foreground">|</span>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-medium text-white">
              <Utensils className="h-3.5 w-3.5" /> {restaurant?.name}
            </div>
          </div>
          <h1 className="text-sm font-semibold text-foreground">Create order</h1>
        </div>
      </header>

      {/* Main two‑column layout */}
      <main className="p-6 h-[calc(100vh-4rem)]">
        <div className="flex flex-col lg:flex-row gap-4 h-full">
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <div className="relative flex-1 min-w-45">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search items…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full rounded-lg border border-white/10 bg-surface-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-white/40 focus:outline-none focus:ring-1 focus:ring-white/30"
                />
              </div>
            </div>

            {/* Category tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3">
              {restaurant?.menu_categories.map((c) => {
                const active = c.id === cat;
                return (
                  <button
                    key={c.id}
                    role="tab"
                    type="button"
                    aria-selected={active}
                    onClick={() => setCat(c.id)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium transition ${
                      active
                        ? "bg-white text-background shadow-[0_4px_12px_-4px_rgba(255,255,255,0.4)]"
                        : "border border-white/10 bg-surface-2 text-muted-foreground hover:border-white/20 hover:text-foreground"
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto pr-1 -mr-1">
              <ul className="space-y-2">
                {visibleItems.map((item) => {
                  const qty = totalQuantityForItem(item.id);
                  return (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 rounded-xl border border-white/5 bg-surface-1 p-2.5 hover:border-white/10"
                    >
                      <div className="h-12 w-12 shrink-0 rounded-lg overflow-hidden bg-surface-2">
                        {item.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image.url}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-foreground truncate">{item.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="shrink-0 font-semibold text-foreground text-sm">
                          {currency}
                          {item.price}
                        </span>
                        <button
                          type="button"
                          onClick={() => openAddonModal(item)}
                          className="rounded-lg border border-white/30 bg-white/10 px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        {qty > 0 && (
                          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">
                            {qty}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              {visibleItems.length === 0 && (
                <div className="flex h-40 items-center justify-center text-muted-foreground">
                  No items found in this category.
                </div>
              )}
            </div>
          </div>

          {/* Right column – two‑step sidebar */}
          <div className="w-full lg:w-96 xl:w-105 shrink-0 flex flex-col h-full">
            <div className="flex-1 rounded-2xl border border-white/5 bg-surface-1 p-4 flex flex-col overflow-hidden">
              <h2 className="font-jetbrains-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                <ShoppingBag className="h-3.5 w-3.5" />
                {checkoutStep === "cart" ? "Order summary" : "Customer details"}
                <span className="ml-auto text-foreground text-xs font-normal">
                  {totals.count} item{totals.count !== 1 && "s"}
                </span>
              </h2>

              {checkoutStep === "cart" ? (
                <>
                  <div className="flex-1 overflow-y-auto -mr-1 pr-1 space-y-1">
                    {totals.items.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        Cart is empty. Add items from the menu.
                      </p>
                    ) : (
                      totals.items.map(({ item, id, addons, quantity }, index) => {
                        const realIndex = cart.findIndex(
                          (c) => c.id === id && JSON.stringify(c.addons) === JSON.stringify(addons),
                        );
                        if (realIndex === -1) return null;
                        const addonTotal = addons.reduce((sum, a) => sum + Number(a.price), 0);
                        const linePrice = (Number(item.price) + addonTotal) * quantity;
                        return (
                          <div
                            key={`${id}-item-${quantity}-${index}`}
                            className="flex items-start gap-2 border-y border-white/5 py-3"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground text-sm truncate">
                                  {quantity}× {item.name}
                                </span>
                                <span className="text-xs text-muted-foreground shrink-0">
                                  {currency}
                                  {linePrice.toFixed(2)}
                                </span>
                              </div>
                              {addons.length > 0 && (
                                <div className="mt-0.5 flex flex-wrap gap-1">
                                  {addons.map((a) => (
                                    <span
                                      key={a.label}
                                      className="inline-block rounded-full border border-white/5 bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                                    >
                                      +{a.label} ({currency}
                                      {a.price})
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => updateQty(realIndex, -1)}
                                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/10 hover:bg-white/5"
                              >
                                <Minus className="h-3 w-3 text-muted-foreground" />
                              </button>
                              <span className="w-6 text-center text-xs font-medium text-foreground">
                                {quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQty(realIndex, 1)}
                                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/10 hover:bg-white/5"
                              >
                                <Plus className="h-3 w-3 text-muted-foreground" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeItem(realIndex)}
                                className="ml-1 text-rose-400 hover:text-rose-500"
                                aria-label="Remove item"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <TotalsDisplay
                    currency={currency}
                    totals={totals.subtotal.toFixed(2)}
                    details={details}
                    subtotal={totals.subtotal}
                    finalTotal={finalTotal}
                    orderSettings={orderSettings}
                  />

                  <button
                    type="button"
                    onClick={() => setCheckoutStep("details")}
                    disabled={totals.items.length === 0}
                    className="mt-4 w-full rounded-xl bg-white py-2.5 text-sm font-semibold text-background shadow-[0_8px_24px_-8px_rgba(255,255,255,0.6)] transition hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Proceed to checkout
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setCheckoutStep("cart")}
                    className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to cart
                  </button>

                  <form
                    onSubmit={pay}
                    className="flex-1 flex flex-col overflow-y-auto -mr-1 pr-1 space-y-3"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Name" error={errors.name}>
                        <input
                          value={details.name}
                          onChange={(e) => setDetails({ ...details, name: e.target.value })}
                          maxLength={80}
                          placeholder="Full name"
                          className="w-full bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                        />
                      </Field>
                      <Field label="Phone" error={errors.phone}>
                        <input
                          value={details.phone}
                          onChange={(e) =>
                            setDetails({ ...details, phone: e.target.value.replace(/[^\d+]/g, "") })
                          }
                          placeholder="Phone"
                          maxLength={30}
                          className="w-full bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                        />
                      </Field>
                    </div>
                    <Field label="Email" error={errors.email}>
                      <input
                        type="email"
                        placeholder="Email"
                        value={details.email}
                        onChange={(e) => setDetails({ ...details, email: e.target.value })}
                        maxLength={255}
                        className="w-full bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                      />
                    </Field>
                    <Field
                      label={details.fulfillment === "delivery" ? "Address" : "Pickup notes"}
                      error={errors.location}
                    >
                      <input
                        value={details.location}
                        onChange={(e) => setDetails({ ...details, location: e.target.value })}
                        maxLength={200}
                        className="w-full bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                        placeholder={
                          details.fulfillment === "delivery"
                            ? "Street, city, postcode"
                            : "Branch or notes"
                        }
                      />
                    </Field>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="font-jetbrains-mono mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">
                          Fulfillment
                        </span>
                        <div className="grid grid-cols-2 gap-1">
                          {(["pickup", "delivery"] as const).map((f) => {
                            const active = details.fulfillment === f;
                            return (
                              <button
                                key={f}
                                type="button"
                                onClick={() => setDetails({ ...details, fulfillment: f })}
                                className={`rounded-lg px-2 py-1.5 text-[11px] font-medium capitalize transition ${
                                  active
                                    ? "border border-white/40 bg-white/10 text-white"
                                    : "border border-white/10 bg-surface-2 text-muted-foreground hover:border-white/20 hover:text-foreground"
                                }`}
                              >
                                {f}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <span className="font-jetbrains-mono mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">
                          Payment
                        </span>
                        <div className="grid grid-cols-2 gap-1">
                          {(["cash", "card"] as const).map((method) => {
                            const active = details.paymentMethod === method;
                            const disabled = method === "card" && !isStripeConfigured;
                            return (
                              <button
                                key={method}
                                type="button"
                                onClick={() =>
                                  !disabled && setDetails({ ...details, paymentMethod: method })
                                }
                                disabled={disabled}
                                className={`rounded-lg px-2 py-1.5 text-[11px] font-medium capitalize transition ${
                                  active
                                    ? "border border-white/40 bg-white/10 text-white"
                                    : "border border-white/10 bg-surface-2 text-muted-foreground hover:border-white/20 hover:text-foreground"
                                } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                              >
                                {method === "cash" ? "Cash" : "Card"}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {details.paymentMethod === "card" && !isStripeConfigured && (
                      <p className="text-[10px] text-rose-400">
                        Card not configured – select Cash.
                      </p>
                    )}

                    <TotalsDisplay
                      currency={currency}
                      totals={totals.subtotal.toFixed(2)}
                      details={details}
                      subtotal={totals.subtotal}
                      finalTotal={finalTotal}
                      orderSettings={orderSettings}
                    />
                    <button
                      type="submit"
                      disabled={paying}
                      className="w-full rounded-xl bg-white py-2.5 text-sm font-semibold text-background shadow-[0_8px_24px_-8px_rgba(255,255,255,0.6)] transition hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        {paying
                          ? "Processing…"
                          : details.paymentMethod === "cash"
                            ? `Place order (${currency}${finalTotal.toFixed(2)} cash)`
                            : `Pay ${currency}${finalTotal.toFixed(2)}`}
                      </span>
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {addonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/5 bg-surface-1 p-4 shadow-xl max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold text-foreground">{addonModal.item.name}</h2>
              <button
                type="button"
                onClick={closeAddonModal}
                className="rounded-full p-1 text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Image */}
            {addonModal.item.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={addonModal.item.image.url}
                alt={addonModal.item.name}
                className="mt-2 w-full max-h-28 rounded-lg object-cover"
              />
            )}

            {/* Description & price */}
            <p className="mt-1.5 text-xs text-muted-foreground">{addonModal.item.description}</p>
            <p className="mt-0.5 font-semibold text-foreground text-sm">
              {currency}
              {addonModal.item.price}
            </p>

            {/* Add‑ons */}
            {addonModal.item.addons && addonModal.item.addons.length > 0 && (
              <div className="mt-3">
                <span className="font-jetbrains-mono block text-[9px] uppercase tracking-wider text-muted-foreground">
                  Add‑ons
                </span>
                <div className="mt-1 space-y-1.5">
                  {addonModal.item.addons.map((addon, idx) => {
                    const checked = selectedAddonIndices.includes(idx);
                    return (
                      <label
                        key={idx}
                        className={`flex cursor-pointer items-center gap-2 rounded-lg border p-1.5 text-xs transition ${
                          checked
                            ? "border-white/40 bg-white/10"
                            : "border-white/5 hover:border-white/10"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            if (checked) {
                              setSelectedAddonIndices(
                                selectedAddonIndices.filter((i) => i !== idx),
                              );
                            } else {
                              setSelectedAddonIndices([...selectedAddonIndices, idx]);
                            }
                          }}
                          className="h-3.5 w-3.5 rounded border-gray-300 text-white focus:ring-white"
                        />
                        <span className="flex-1 text-muted-foreground">{addon.label}</span>
                        <span className="font-medium text-foreground">
                          +{currency}
                          {addon.price}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Customisation */}
            <div className="mt-3">
              <Field label="Customisation (optional)" error={""}>
                <input
                  value={customization}
                  type="text"
                  onChange={(e) => setCustomization(e.target.value)}
                  maxLength={80}
                  placeholder="e.g. no onions, extra sauce…"
                  className="w-full bg-transparent px-3 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </Field>
            </div>

            {/* Quantity */}
            <div className="mt-3 flex items-center gap-3">
              <span className="text-sm font-medium text-foreground">Quantity</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 transition hover:bg-white/5"
                >
                  <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <span className="min-w-6 text-center font-semibold text-foreground text-sm">
                  {modalQuantity}
                </span>
                <button
                  type="button"
                  onClick={() => setModalQuantity(modalQuantity + 1)}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 transition hover:bg-white/5"
                >
                  <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Add button */}
            <button
              type="button"
              onClick={confirmAddToCart}
              className="mt-4 w-full rounded-full bg-white py-2 text-sm font-semibold text-background shadow-[0_6px_16px_-6px_rgba(255,255,255,0.5)] transition hover:bg-white/90"
            >
              Add to cart
            </button>
          </div>
        </div>
      )}

      {/* Thank‑you modal */}
      {thankYou && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-white/5 bg-surface-1 p-8 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-foreground">
              {details.paymentMethod === "cash" ? "Order placed!" : "Thank you!"}
            </h2>

            <button
              type="button"
              onClick={() => router.push("/dashboard/orders")}
              className="mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4" /> Go to orders
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateOrderPage;

// Reusable field
const Field = ({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) => (
  <label className="block">
    <span className="font-jetbrains-mono mb-0.5 block text-[10px] uppercase tracking-wider text-muted-foreground">
      {label}
    </span>
    <div className="rounded-lg border border-white/5 bg-surface-2 overflow-hidden">{children}</div>
    {error && <span className="mt-0.5 block text-[10px] text-rose-400">{error}</span>}
  </label>
);

const TotalsDisplay = ({
  currency,
  totals,
  details,
  orderSettings,
  finalTotal,
  subtotal,
}: {
  currency: string;
  totals: string;
  details: DetailType;
  orderSettings: RestaurantOrderSettings;
  finalTotal: number;
  subtotal: number;
}) => (
  <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5">
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">Subtotal</span>
      <span className="text-foreground">
        {currency}
        {totals}
      </span>
    </div>
    {details.fulfillment === "delivery" && (
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Delivery fee</span>
        <span className="text-foreground">
          {currency}
          {Number(orderSettings?.deliveryFee ?? 0).toFixed(2)}
        </span>
      </div>
    )}
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">
        Tax ({Number(orderSettings?.taxRate ?? 0).toFixed(1)}%)
      </span>
      <span className="text-foreground">
        {currency}
        {((subtotal * Number(orderSettings?.taxRate ?? 0)) / 100).toFixed(2)}
      </span>
    </div>
    <div className="flex justify-between text-base font-bold pt-1 border-t border-white/5">
      <span className="text-foreground">Total</span>
      <span className="text-foreground">
        {currency}
        {finalTotal.toFixed(2)}
      </span>
    </div>
  </div>
);
