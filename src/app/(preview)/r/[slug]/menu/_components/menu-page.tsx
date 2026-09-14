"use client";
import RestaurantStatusBadge from "@/app/(dashboard)/dashboard/(with-sidebar)/appearance/_components/sections/restaurant-status-badge";
import {
  getFontStack,
  getGlassFilter,
  resolvedButtonRadius,
  resolvedSectionRadius,
  SHADOW_MAP,
} from "@/app/(dashboard)/dashboard/(with-sidebar)/appearance/_components/utils";
import { useRestaurantOpen } from "@/hooks/use-restaurant-open";
import { MenuItemTags } from "@/components/shared/menu-item-tags";
import { PopupRenderer } from "@/components/shared/popup-renderer";
import { getCurrencySymbol } from "@/lib/stripe/types";
import { Addon } from "@/lib/types";
import { AppearanceSettings } from "@/lib/types/appearnace";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  LayoutGrid,
  ListIcon,
  Minus,
  Plus,
  ShieldAlert,
  ShoppingBag,
  Utensils,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { processOrder } from "../action";
import { MenuPageRestaurantType } from "../query";
import {
  addToCart,
  pruneInvalidCartItems,
  removeCartItem,
  updateCartItemQuantity,
  useCartStore,
} from "@/stores/cart-store";
import { setMenuView, useMenuUIStore } from "@/stores/menu-ui-store";
import { AppearanceBackground } from "@/components/shared/appearance-background";
const EMPTY_CART: CartItem[] = [];

/** Survives a refresh: `/r/<slug>/menu?step=checkout`. */
const STEP_PARAM = "step";
const CHECKOUT_STEP = "checkout";

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

const MenuPage = ({
  restaurant,
  initialStep,
}: {
  restaurant: NonNullable<MenuPageRestaurantType>;
  /** Read from the URL on the server, so the first paint is already correct. */
  initialStep?: string;
}) => {
  const isStripeConfigured = restaurant?.stripe?.configured ?? false;
  const isOpen = useRestaurantOpen(restaurant);
  const orderSettings = restaurant.orderSettings;
  const isClosed = orderSettings.status === "closed";

  const settings = restaurant.appearance_settings;
  const font = getFontStack(settings.fontFamily);
  const router = useRouter();
  const [cat, setCat] = useState(restaurant?.menu_categories?.[0]?.id ?? "");
  const sectionRadius = resolvedSectionRadius(settings);
  const buttonRadius = resolvedButtonRadius(settings);

  const glassFilter = getGlassFilter(settings.glassBlur);
  const fontTitle = settings?.alternative_title_font
    ? getFontStack(settings.alternative_title_font)
    : "";

  const sectionDepth: React.CSSProperties = {
    boxShadow: SHADOW_MAP[settings.sectionShadow ?? "none"],
    backdropFilter: glassFilter,
    WebkitBackdropFilter: glassFilter,
  };

  const buttonDepth: React.CSSProperties = {
    boxShadow: SHADOW_MAP[settings.buttonShadow ?? "none"],
    backdropFilter: glassFilter,
    WebkitBackdropFilter: glassFilter,
  };

  const sectionItemHeadingStyle: React.CSSProperties = {
    color: settings.sectionItemHeadingColor,
    fontSize: `${settings.sectionItemHeadingFontSize}px`,
    fontWeight: settings.sectionItemHeadingFontWeight,
  };

  const sectionItemTextStyle: React.CSSProperties = {
    color: settings.sectionItemTextColor,
    fontSize: `${settings.sectionItemTextFontSize}px`,
    fontWeight: settings.sectionItemTextFontWeight,
  };

  const HeaderIconStyle: React.CSSProperties = {
    background: `${settings.sectionIconBgColor}`,
    color: settings.sectionIconColor,
    border: `1px solid ${settings.sectionIconBorderColor}`,
    borderRadius: `${settings.sectionIconRadiusPx}px`,
  };

  const sectionStyle = (): React.CSSProperties => {
    switch (settings.sectionStyle) {
      case "solid":
        return {
          ...sectionDepth,
          background: settings.sectionBgColor,
          border: `1px solid ${settings.sectionBorderColor}`,
          borderRadius: `${settings.sectionRadiusPx}px`,
          padding: `${settings.sectionPaddingY}px ${settings.sectionPaddingX}px`,
        };
      case "outline":
        return {
          ...sectionDepth,
          background: "transparent",
          border: `1px solid ${settings.sectionBorderColor}`,
          borderRadius: `${settings.sectionRadiusPx}px`,
          padding: `${settings.sectionPaddingY}px ${settings.sectionPaddingX}px`,
        };
      case "gradient":
        return {
          ...sectionDepth,
          background: `linear-gradient(135deg, ${settings.sectionBgColor}, ${settings.sectionBgColorTo})`,
          border: `1px solid ${settings.sectionBorderColor}`,
          borderRadius: `${settings.sectionRadiusPx}px`,
          padding: `${settings.sectionPaddingY}px ${settings.sectionPaddingX}px`,
        };
      default:
        return {
          ...sectionDepth,
          background: settings.sectionBgColor,
          border: `1px solid ${settings.sectionBorderColor}`,
          borderRadius: `${settings.sectionRadiusPx}px`,
          padding: `${settings.sectionPaddingY}px ${settings.sectionPaddingX}px`,
        };
    }
  };

  const buttonStyle = (): React.CSSProperties => {
    switch (settings.buttonStyle) {
      case "solid":
        return {
          ...buttonDepth,
          background: settings.buttonBgColor,
          color: settings.buttonTextColor,
          border: `1px solid ${settings.buttonBorderColor}`,
        };
      case "outline":
        return {
          ...buttonDepth,
          background: "transparent",
          color: settings.buttonTextColor,
          border: `1px solid ${settings.buttonBorderColor}`,
        };
      case "gradient":
        return {
          ...buttonDepth,
          background: `linear-gradient(135deg, ${settings.buttonBgColor}, ${settings.buttonBgColorTo})`,
          color: settings.buttonTextColor,
          border: `1px solid ${settings.buttonBorderColor}`,
        };
      default:
        return {
          ...buttonDepth,
          background: settings.buttonBgColor,
          color: settings.buttonTextColor,
          border: `1px solid ${settings.buttonBorderColor}`,
          backdropFilter: glassFilter ?? "blur(8px)",
        };
    }
  };

  const { padding, ...sectionStyleWithoutPadding } = sectionStyle();
  console.log(padding);
  const slug = restaurant.slug;

  const view = useMenuUIStore((state) => state.view);
  const cart = useCartStore((state) => state.carts[slug] ?? EMPTY_CART);

  const searchParams = useSearchParams();
  const stepParam = searchParams.get(STEP_PARAM) ?? initialStep;
  const requestedStep = stepParam === CHECKOUT_STEP ? "checkout" : "menu";
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

  // Modal state for add‑on selection
  const [addonModal, setAddonModal] = useState<{ item: (typeof allItems)[0] } | null>(null);
  const [selectedAddonIndices, setSelectedAddonIndices] = useState<number[]>([]);
  const [modalQuantity, setModalQuantity] = useState(1);

  const allItems = useMemo(
    () => restaurant?.menu_categories.flatMap((category) => category.items) ?? [],
    [restaurant],
  );

  useEffect(() => {
    const removed = pruneInvalidCartItems(
      slug,
      allItems.map((i) => i.id),
    );
    if (removed.length > 0) {
      toast.error(
        removed.length === 1
          ? "An item in your cart is no longer available and was removed."
          : `${removed.length} items in your cart are no longer available and were removed.`,
      );
    }
  }, [allItems, slug]);

  const setView = (newView: "grid" | "list") => {
    setMenuView(newView);
  };

  // Compute totals from cart items (including addon prices)
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

  const step: "menu" | "checkout" =
    requestedStep === CHECKOUT_STEP && totals.count > 0 && !isClosed ? "checkout" : "menu";

  const goToStep = useCallback((next: "menu" | "checkout") => {
    const params = new URLSearchParams(window.location.search);
    if (next === CHECKOUT_STEP) params.set(STEP_PARAM, CHECKOUT_STEP);
    else params.delete(STEP_PARAM);

    const query = params.toString();

    window.history.pushState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
  }, []);

  const finalTotal = useMemo(() => {
    const subtotal = totals.subtotal;
    const isDelivery = details.fulfillment === "delivery";
    const deliveryFee = isDelivery ? Number(orderSettings?.deliveryFee ?? 0) : 0;
    const taxRate = Number(orderSettings?.taxRate ?? 0);
    const tax = (subtotal * taxRate) / 100;
    return subtotal + deliveryFee + tax;
  }, [totals.subtotal, details.fulfillment, orderSettings]);

  const allowedFulfillment = useMemo<("pickup" | "delivery")[]>(() => {
    const status = orderSettings?.status ?? "open";
    if (status === "closed") return [];
    if (status === "no-delivery") return ["pickup"];
    if (status === "no-pickup") return ["delivery"];
    return ["pickup", "delivery"];
  }, [orderSettings]);

  const validateCheckout = (): string | null => {
    if (!isOpen) return "Restaurant is currently closed.";
    if (!isStripeConfigured && details.paymentMethod === "card") {
      return "Card payments are not configured. Please use cash or contact the restaurant.";
    }
    if (details.paymentMethod === "cash" && details.fulfillment === "delivery") {
      return "Cash is only available for pickup orders.";
    }
    const status = orderSettings?.status ?? "open";
    if (status === "closed") return "Restaurant is not accepting orders.";
    const fulfillment = details.fulfillment;
    if (status === "no-delivery" && fulfillment === "delivery") return "Delivery is not available.";
    if (status === "no-pickup" && fulfillment === "pickup") return "Pickup is not available.";
    return null;
  };

  // Helper: get total quantity for a given item id (across all addon combinations)
  const totalQuantityForItem = (itemId: string) => {
    return cart.filter((c) => c.id === itemId).reduce((sum, c) => sum + c.quantity, 0);
  };

  // Add to cart: merge if same item + same addons (compare by label/price)
  const addToCartL = (
    itemId: string,
    addons: Addon[],
    quantity: number,
    customization?: string,
  ) => {
    addToCart(slug, { id: itemId, addons, quantity, customization });
  };

  // Remove / adjust quantity in checkout
  const updateQty = (index: number, delta: number) => {
    updateCartItemQuantity(slug, index, delta);
  };

  const removeItem = (index: number) => {
    removeCartItem(slug, index);
  };

  // Modal handlers
  const openAddonModal = (item: (typeof allItems)[0]) => {
    setAddonModal({ item });
    setSelectedAddonIndices([]);
    setModalQuantity(1);
    setCustomization("");
  };

  const closeAddonModal = () => {
    setAddonModal(null);
  };

  useEffect(() => {
    // If delivery is selected, force payment method to card
    if (details.fulfillment === "delivery" && details.paymentMethod === "cash") {
      setDetails((prev) => ({ ...prev, paymentMethod: "card" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [details.fulfillment]);

  const confirmAddToCart = () => {
    if (!addonModal) return;
    const { item } = addonModal;
    const selectedAddons = selectedAddonIndices.map(
      (idx) => item.addons?.[idx] || { label: "", price: 0 },
    );
    addToCartL(item.id, selectedAddons, modalQuantity, customization.trim() || undefined);
    closeAddonModal();
    toast.success(`Added ${modalQuantity} × ${item.name} to cart`);
  };

  const visibleItems = useMemo(() => {
    return restaurant?.menu_categories.find((c) => c.id === cat)?.items ?? [];
  }, [cat, restaurant]);

  // Payment
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

    const response = await processOrder({
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
    toast.success("Order placed!", { description: "Pay upon pickup." });
  };

  useEffect(() => {
    if (allowedFulfillment.length > 0 && !allowedFulfillment.includes(details.fulfillment)) {
      setDetails((prev) => ({ ...prev, fulfillment: allowedFulfillment[0] ?? "delivery" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowedFulfillment]);

  const hasOpeningHours = !!restaurant.opening_hours;

  const currency = getCurrencySymbol(restaurant.stripe?.currency);

  return (
    <div className="relative isolate min-h-screen pb-25" style={{ fontFamily: font }}>
      <AppearanceBackground settings={settings} />
      <header
        className="z-30 sticky top-0 backdrop-blur"
        style={{ borderBottom: `1px solid ${settings.sectionBorderColor}` }}
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link
            href={`/r/${restaurant?.slug}`}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition hover:opacity-80"
            style={{
              ...sectionStyleWithoutPadding,
              color: settings.sectionItemHeadingColor,
            }}
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Link>
          <div className="flex items-center gap-2">
            {hasOpeningHours && (
              <RestaurantStatusBadge
                buttonStyle={() => ({
                  ...buttonStyle(),
                  borderRadius: buttonRadius,
                })}
                restaurant={restaurant}
              />
            )}
            <div
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition hover:opacity-80"
              style={{
                background: settings.sectionIconBgColor,
                color: settings.sectionIconColor,
                border: `1px solid ${settings.sectionIconBorderColor}`,
                borderRadius: `${settings.sectionIconRadiusPx}px`,
              }}
            >
              <Utensils className="h-3.5 w-3.5" /> {restaurant?.name}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-6">
        {step === "menu" && (
          <>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1
                  style={{
                    color: settings.heading_color,
                    fontFamily: settings.alternative_title_font ? fontTitle : "inherit",
                    fontSize: `${settings.sectionHeaderFontSize + 9}px`,
                    fontWeight: settings.sectionHeaderFontWeight,
                  }}
                  className="leading-[1.2]"
                >
                  {isClosed ? `Menu · ${restaurant.name}` : "Order online"}
                </h1>
                {!isClosed && (
                  <p
                    className="mt-1 leading-[1.2]"
                    style={{
                      color: settings.text_color,
                      fontSize: `${settings.sectionHeaderFontSize - 6}px`,
                      fontWeight: 400,
                    }}
                  >
                    Tap to add items, then checkout securely with Stripe.
                  </p>
                )}
              </div>
              {/* Grid / List view toggle */}
              <div
                role="group"
                aria-label="View mode"
                className="ml-auto inline-flex items-center rounded-full p-1 shadow-sm"
                style={{
                  border: `1px solid ${settings.sectionInIconBorderColor}`,
                  background: settings.sectionInIconBgColor,
                }}
              >
                {[
                  { id: "grid" as const, Icon: LayoutGrid, label: "Grid" },
                  { id: "list" as const, Icon: ListIcon, label: "List" },
                ].map(({ id, Icon, label }) => {
                  const active = view === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setView(id)}
                      aria-pressed={active}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition"
                      style={{
                        border: active ? HeaderIconStyle.border : "1px solid transparent",
                        background: active ? HeaderIconStyle.background : "transparent",
                        color: active ? HeaderIconStyle.color : settings.sectionInIconColor,
                      }}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="-mx-1 mt-5 mb-4 flex gap-1.5 scrollbar-dark overflow-x-auto px-1 pb-1">
              {restaurant?.menu_categories.map((c) => {
                const active = c.id === cat;
                return (
                  <button
                    key={c.id}
                    role="tab"
                    type="button"
                    aria-selected={active}
                    onClick={() => setCat(c.id)}
                    className="shrink-0 shadow-sm rounded-full px-3 py-1.5 text-[11px] font-semibold transition"
                    style={{
                      border: `${active ? HeaderIconStyle.border : `1px solid ${settings.sectionInIconBorderColor}`}`,
                      background: active
                        ? HeaderIconStyle.background
                        : settings.sectionInIconBgColor,
                      color: active ? HeaderIconStyle.color : settings.sectionInIconColor,
                    }}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>

            {view === "grid" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {visibleItems.map((item) => {
                  const qty = totalQuantityForItem(item.id);
                  return (
                    <article
                      key={item.id}
                      className="overflow-hidden transition hover:-translate-y-0.5"
                      style={{
                        ...sectionStyleWithoutPadding,
                        borderRadius: sectionRadius,
                      }}
                    >
                      {item.image?.url && (
                        <div className="relative aspect-4/3 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.image.url}
                            alt={item.name}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-3.5">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="" style={sectionItemHeadingStyle}>
                            {item.name}
                          </h3>
                          {!isClosed && (
                            <span className="shrink-0" style={sectionItemHeadingStyle}>
                              {currency}
                              {item.price}
                            </span>
                          )}
                        </div>
                        <p className="line-clamp-2" style={sectionItemTextStyle}>
                          {item.description}
                        </p>
                        <MenuItemTags tags={item.tags} settings={settings} className="mt-2" />
                        {!isClosed && (
                          <div className="flex items-center justify-end mt-3">
                            <button
                              type="button"
                              onClick={() => openAddonModal(item)}
                              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition shadow-sm"
                              style={{
                                background: settings.sectionIconBgColor,
                                color: settings.sectionIconColor,
                                border: `1px solid ${settings.sectionIconBorderColor}`,
                              }}
                            >
                              <Plus className="h-3.5 w-3.5" />
                              {qty > 0 ? `Add (${qty})` : "Add"}
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <ul className="overflow-hidden space-y-2">
                {visibleItems.map((item) => {
                  const qty = totalQuantityForItem(item.id);
                  return (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 p-3 sm:gap-4 sm:p-4"
                      style={{
                        ...sectionStyle(),
                        borderRadius: sectionRadius,
                      }}
                    >
                      <div className="flex items-center gap-4 justify-start">
                        {item.image?.url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image.url}
                            alt={item.name}
                            loading="lazy"
                            className="h-18 w-18 shrink-0 rounded-xl object-cover"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="line-clamp-1" style={sectionItemHeadingStyle}>
                              {item.name}
                            </h3>
                          </div>
                          <p className="mt-1 line-clamp-2" style={sectionItemTextStyle}>
                            {item.description}
                          </p>
                          <MenuItemTags tags={item.tags} settings={settings} className="mt-1.5" />
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        {!isClosed && (
                          <span
                            className="text-sm font-bold sm:text-base"
                            style={sectionItemHeadingStyle}
                          >
                            {currency}
                            {item.price}
                          </span>
                        )}
                        {!isClosed && (
                          <button
                            type="button"
                            onClick={() => openAddonModal(item)}
                            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition shadow-sm"
                            style={{
                              background: settings.sectionIconBgColor,
                              color: settings.sectionIconColor,
                              border: `1px solid ${settings.sectionIconBorderColor}`,
                            }}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            {qty > 0 ? `Add (${qty})` : "Add"}
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}

        {step === "checkout" && (
          <>
            <button
              onClick={() => goToStep("menu")}
              className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium transition"
              style={{ color: settings.text_color }}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to menu
            </button>

            <div>
              <h1
                style={{
                  color: settings.heading_color,
                  fontFamily: settings.alternative_title_font ? fontTitle : "inherit",
                  fontSize: `${settings.sectionHeaderFontSize + 9}px`,
                  fontWeight: settings.sectionHeaderFontWeight,
                }}
                className="leading-[1.2]"
              >
                Order online
              </h1>
              <p
                className="mt-1 leading-[1.2]"
                style={{
                  color: settings.text_color,
                  fontSize: `${settings.sectionHeaderFontSize - 6}px`,
                  fontWeight: 400,
                }}
              >
                Tap to add items, then checkout securely with Stripe.
              </p>
            </div>

            <div
              className="mt-5 rounded-2xl p-4"
              style={{ ...sectionStyle(), borderRadius: sectionRadius }}
            >
              <div
                className="font-jetbrains-mono mb-2 text-[10px] uppercase tracking-wider"
                style={{ color: settings.sectionItemHeadingColor }}
              >
                Your order
              </div>
              {totals.items.length === 0 ? (
                <p className="text-sm" style={{ color: settings.sectionItemTextColor }}>
                  Your cart is empty.
                </p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {totals.items.map(({ item, id, addons, quantity }) => {
                    const realIndex = cart.findIndex(
                      (c) => c.id === id && JSON.stringify(c.addons) === JSON.stringify(addons),
                    );
                    if (realIndex === -1) return null;
                    const addonTotal = addons.reduce((sum, a) => sum + Number(a.price), 0);
                    const linePrice = (Number(item.price) + addonTotal) * quantity;
                    return (
                      <li
                        key={`${id}-${addons.map((a) => a.label).join(",")}`}
                        className="flex justify-between items-start gap-2 py-1 border-b border-opacity-20"
                        style={{ borderColor: settings.sectionBorderColor }}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium" style={sectionItemHeadingStyle}>
                              {quantity}× {item.name}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => updateQty(realIndex, -1)}
                                className="inline-flex h-5 w-5 items-center justify-center rounded-full border"
                                style={{ borderColor: settings.sectionBorderColor }}
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span
                                className="text-xs"
                                style={{ color: settings.sectionItemTextColor }}
                              >
                                {quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQty(realIndex, 1)}
                                className="inline-flex h-5 w-5 items-center justify-center rounded-full border"
                                style={{ borderColor: settings.sectionBorderColor }}
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(realIndex)}
                              className="ml-1 text-rose-400 hover:text-rose-500"
                              aria-label="Remove item"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          {addons.length > 0 && (
                            <div className="mt-0.5 flex flex-wrap gap-1">
                              {addons.map((a) => (
                                <span
                                  key={a.label}
                                  className="inline-block rounded-full px-2 py-0.5 text-[10px]"
                                  style={{
                                    background: settings.sectionInIconBgColor,
                                    color: settings.sectionInIconColor,
                                    border: `1px solid ${settings.sectionInIconBorderColor}`,
                                  }}
                                >
                                  +{a.label} ({currency}
                                  {a.price})
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="font-medium shrink-0" style={sectionItemHeadingStyle}>
                          {currency}
                          {linePrice.toFixed(2)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span style={sectionItemTextStyle}>Subtotal</span>
                  <span style={sectionItemHeadingStyle}>
                    {currency}
                    {totals.subtotal.toFixed(2)}
                  </span>
                </div>
                {details.fulfillment === "delivery" && (
                  <div className="flex justify-between">
                    <span style={sectionItemTextStyle}>Delivery fee</span>
                    <span style={sectionItemHeadingStyle}>
                      {currency}
                      {Number(orderSettings?.deliveryFee ?? 0).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span style={sectionItemTextStyle}>
                    Tax ({Number(orderSettings?.taxRate ?? 0).toFixed(1)}%)
                  </span>
                  <span style={sectionItemHeadingStyle}>
                    {currency}
                    {((totals.subtotal * Number(orderSettings?.taxRate ?? 0)) / 100).toFixed(2)}
                  </span>
                </div>
                <div
                  className="flex justify-between pt-2 text-base font-bold"
                  style={{
                    borderTop: `1px solid ${settings.sectionBorderColor}`,
                  }}
                >
                  <span style={sectionItemHeadingStyle}>Total</span>
                  <span style={sectionItemHeadingStyle}>
                    {currency}
                    {finalTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {totals.count > 0 && (
              <form
                onSubmit={pay}
                className="mt-4 space-y-4 rounded-2xl p-5"
                style={{ ...sectionStyle(), borderRadius: sectionRadius }}
              >
                <style>
                  {`
                                    .custom-placeholder::placeholder {
                                        color: ${settings.sectionItemTextColor};
                                        opacity: 1;
                                    }
                                `}
                </style>
                <Field
                  settings={settings}
                  label="Full name"
                  error={errors.name}
                  sectionRadius={sectionRadius}
                >
                  <input
                    value={details.name}
                    onChange={(e) => setDetails({ ...details, name: e.target.value })}
                    maxLength={80}
                    placeholder="Enter your full name"
                    className="custom-placeholder w-full bg-transparent px-3 py-2.5 text-sm outline-none"
                  />
                </Field>
                <Field
                  settings={settings}
                  label="Phone"
                  error={errors.phone}
                  sectionRadius={sectionRadius}
                >
                  <input
                    value={details.phone}
                    type="number"
                    onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                    placeholder="Enter your phone number"
                    maxLength={30}
                    className="custom-placeholder w-full bg-transparent px-3 py-2.5 text-sm outline-none"
                  />
                </Field>
                <Field
                  settings={settings}
                  label="Email"
                  error={errors.email}
                  sectionRadius={sectionRadius}
                >
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={details.email}
                    onChange={(e) => setDetails({ ...details, email: e.target.value })}
                    maxLength={255}
                    className="custom-placeholder w-full bg-transparent px-3 py-2.5 text-sm outline-none"
                  />
                </Field>
                <Field
                  settings={settings}
                  label={
                    details.fulfillment === "delivery"
                      ? "Delivery address"
                      : "Pickup location / notes"
                  }
                  error={errors.location}
                  sectionRadius={sectionRadius}
                >
                  <input
                    value={details.location}
                    onChange={(e) => setDetails({ ...details, location: e.target.value })}
                    maxLength={200}
                    className="custom-placeholder w-full bg-transparent px-3 py-2.5 text-sm outline-none"
                    placeholder={
                      details.fulfillment === "delivery"
                        ? "Street, city, postcode"
                        : "Branch or pickup notes"
                    }
                  />
                </Field>
                <div>
                  <span
                    className="font-jetbrains-mono mb-1.5 block text-[10px] uppercase tracking-wider"
                    style={{ color: settings.sectionItemHeadingColor }}
                  >
                    Fulfillment
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {(["pickup", "delivery"] as const).map((f) => {
                      const active = details.fulfillment === f;
                      const disabled = !allowedFulfillment.includes(f);
                      return (
                        <button
                          key={f}
                          type="button"
                          onClick={() => !disabled && setDetails({ ...details, fulfillment: f })}
                          disabled={disabled}
                          className={`rounded-xl px-3 py-2.5 text-xs font-semibold capitalize transition ${
                            disabled ? "opacity-40 cursor-not-allowed" : ""
                          }`}
                          style={{
                            border: active
                              ? HeaderIconStyle.border
                              : `1px solid ${settings.sectionInIconBorderColor}`,
                            background: active
                              ? HeaderIconStyle.background
                              : settings.sectionInIconBgColor,
                            color: active ? HeaderIconStyle.color : settings.sectionInIconColor,
                          }}
                        >
                          {f}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <span
                    className="font-jetbrains-mono mb-1.5 block text-[10px] uppercase tracking-wider"
                    style={{ color: settings.sectionItemHeadingColor }}
                  >
                    Payment method
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {(["cash", "card"] as const).map((method) => {
                      // Only show cash if pickup is selected
                      if (method === "cash" && details.fulfillment !== "pickup") return null;

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
                          className={`rounded-xl px-3 py-2.5 text-xs font-semibold capitalize transition ${
                            disabled ? " cursor-not-allowed" : ""
                          }`}
                          style={{
                            border: active
                              ? HeaderIconStyle.border
                              : `1px solid ${settings.sectionInIconBorderColor}`,
                            background: active
                              ? HeaderIconStyle.background
                              : settings.sectionInIconBgColor,
                            color: active ? HeaderIconStyle.color : settings.sectionInIconColor,
                          }}
                        >
                          {method}
                        </button>
                      );
                    })}
                  </div>
                  {details.paymentMethod === "card" && !isStripeConfigured && (
                    <p
                      className="mt-1 text-[10px]"
                      style={{ color: settings.sectionItemTextColor }}
                    >
                      Card payments not available – please select Cash.
                    </p>
                  )}
                  {details.fulfillment === "delivery" && (
                    <p
                      className="mt-1 text-[10px]"
                      style={{ color: settings.sectionItemTextColor }}
                    >
                      Cash is not accepted for delivery – please pay by card.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={paying}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition disabled:opacity-60"
                  style={HeaderIconStyle}
                >
                  <CreditCard className="h-4 w-4" />
                  {paying
                    ? "Processing…"
                    : details.paymentMethod === "cash"
                      ? `Place order (${currency}${finalTotal.toFixed(2)} cash)`
                      : `Pay ${currency}${finalTotal.toFixed(2)} with Stripe`}
                </button>
                <p
                  className="text-center text-[10px]"
                  style={{ color: settings.sectionItemHeadingColor }}
                >
                  Secure payment by Stripe. Test mode.
                </p>
              </form>
            )}
          </>
        )}
      </main>

      {/* Sticky checkout bar */}
      {step === "menu" && totals.count > 0 && !isClosed && (
        <div
          className="fixed inset-x-0 bottom-0 z-30 backdrop-blur"
          style={{ borderTop: `1px solid ${settings.sectionBorderColor}` }}
        >
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                style={HeaderIconStyle}
              >
                <ShoppingBag className="h-4 w-4" />
              </span>
              <div>
                <div className="font-semibold" style={{ color: settings.heading_color }}>
                  {totals.count} item{totals.count > 1 ? "s" : ""}
                </div>
                <div className="text-xs" style={{ color: settings.text_color }}>
                  {currency}
                  {finalTotal.toFixed(2)}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => goToStep("checkout")}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
              style={HeaderIconStyle}
            >
              Checkout
            </button>
          </div>
        </div>
      )}

      {/* Add‑on Modal */}
      {addonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-3xl p-4 shadow-2xl max-h-[90vh] overflow-y-auto sm:p-6"
            style={sectionStyleWithoutPadding}
          >
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-bold" style={{ color: settings.sectionItemHeadingColor }}>
                {addonModal.item.name}
              </h2>
              <button
                type="button"
                onClick={closeAddonModal}
                className="rounded-full p-1 hover:bg-black/5"
                style={{ color: settings.sectionItemTextColor }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {addonModal.item.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={addonModal.item.image.url}
                alt={addonModal.item.name}
                className="mt-3 rounded-xl w-full max-h-40 object-cover"
              />
            )}
            <p className="mt-2 text-sm" style={{ color: settings.sectionItemTextColor }}>
              {addonModal.item.description}
            </p>
            <p className="mt-1 font-semibold" style={sectionItemHeadingStyle}>
              {currency}
              {addonModal.item.price}
            </p>

            {addonModal.item.addons && addonModal.item.addons.length > 0 && (
              <div className="mt-4">
                <span
                  className="font-jetbrains-mono block text-[10px] uppercase tracking-wider"
                  style={{ color: settings.sectionItemHeadingColor }}
                >
                  Add‑ons
                </span>
                <div className="mt-2 space-y-2">
                  {addonModal.item.addons.map((addon, idx) => {
                    const checked = selectedAddonIndices.includes(idx);
                    return (
                      <label
                        key={idx}
                        className="flex items-center gap-2 rounded-lg p-2 transition cursor-pointer"
                        style={{
                          // background: checked ? settings.sectionIconBgColor : "transparent",
                          border: `1px solid ${checked ? settings.sectionIconBorderColor : settings.sectionInIconBorderColor}`,
                        }}
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
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span
                          className="flex-1 text-sm"
                          style={{ color: settings.sectionItemTextColor }}
                        >
                          {addon.label}
                        </span>
                        <span className="text-sm font-medium" style={sectionItemHeadingStyle}>
                          +{currency}
                          {addon.price}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="mt-4">
              <Field
                settings={settings}
                label=" Customisation (optional)"
                error={""}
                sectionRadius={sectionRadius}
              >
                <input
                  value={customization}
                  type="text"
                  onChange={(e) => setCustomization(e.target.value)}
                  maxLength={80}
                  placeholder="e.g. no onions, extra sauce…"
                  className="custom-placeholder w-full bg-transparent px-3 py-2.5 text-sm outline-none"
                />
              </Field>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <span
                className="text-sm font-medium"
                style={{ color: settings.sectionItemHeadingColor }}
              >
                Quantity
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border"
                  style={HeaderIconStyle}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-8 text-center font-semibold" style={sectionItemHeadingStyle}>
                  {modalQuantity}
                </span>
                <button
                  type="button"
                  onClick={() => setModalQuantity(modalQuantity + 1)}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border"
                  style={HeaderIconStyle}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={confirmAddToCart}
              className="mt-6 w-full rounded-full py-3 text-sm font-semibold transition"
              style={HeaderIconStyle}
            >
              Add to cart
            </button>
          </div>
        </div>
      )}

      {/* Thank‑you modal */}
      {thankYou && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl"
            style={sectionStyleWithoutPadding}
          >
            <div
              className="mx-auto flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
              style={HeaderIconStyle}
            >
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="mt-4" style={{ color: settings.sectionItemHeadingColor }}>
              {details.paymentMethod === "cash" ? "Order placed!" : "Thank you for your payment!"}
            </h2>
            <p className="mt-2 text-sm" style={{ color: settings.sectionItemTextColor }}>
              {details.paymentMethod === "cash"
                ? `Your order is confirmed. Please pay ${currency}${finalTotal.toFixed(2)} upon pickup.`
                : `We've sent a receipt to ${details.email}. Your order is on the way.`}
            </p>
            <button
              type="button"
              onClick={() => router.push(`/r/${restaurant.slug}`)}
              className="mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold"
              style={{ ...buttonStyle(), borderRadius: buttonRadius }}
            >
              <ArrowLeft className="h-4 w-4" /> Go back
            </button>
          </div>
        </div>
      )}
      <PopupRenderer popups={restaurant.popups} settings={settings} onPage="menu" />
    </div>
  );
};

export default MenuPage;

const Field = ({
  label,
  error,
  children,
  settings,
  sectionRadius,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  settings: AppearanceSettings;
  sectionRadius: string;
}) => (
  <label className="block">
    <span
      className="font-jetbrains-mono mb-1.5 block text-[10px] uppercase tracking-wider"
      style={{ color: settings.sectionItemHeadingColor }}
    >
      {label}
    </span>
    <div
      style={{
        background: settings.sectionBgColor,
        border: `1px solid ${settings.sectionBorderColor}`,
        color: `${settings.sectionItemHeadingColor}`,
        borderRadius: sectionRadius,
        overflow: "hidden",
      }}
    >
      {children}
    </div>
    {error && (
      <span
        className="mt-1 flex gap-1 items-start text-[13px]"
        style={{ color: settings.sectionItemHeadingColor }}
      >
        <ShieldAlert className="size-4 shrink-0" /> {error}
      </span>
    )}
  </label>
);
