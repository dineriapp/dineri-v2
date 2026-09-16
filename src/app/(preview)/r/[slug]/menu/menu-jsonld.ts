import { venueUrl } from "@/lib/venue-url";
import type { StripeCurrency } from "@/lib/stripe/types";
import { resolveTags, type TagKey } from "@/utils/tags";

const DIET_URL: Partial<Record<TagKey, string>> = {
  vegetarian: "https://schema.org/VegetarianDiet",
  vegan: "https://schema.org/VeganDiet",
  gluten_free: "https://schema.org/GlutenFreeDiet",
  halal: "https://schema.org/HalalDiet",
};

type Item = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  tags: string[] | null;
};

type Category = { id: string; name: string; items: Item[] };

function describeItem(item: Item): string | undefined {
  const written = item.description?.trim();
  const allergens = resolveTags(item.tags)
    .filter((tag) => tag.group === "allergen")
    .map((tag) => tag.label.toLowerCase());

  const note = allergens.length > 0 ? `Contains ${allergens.join(", ")}.` : "";
  const text = [written, note].filter(Boolean).join(" ");
  return text || undefined;
}

function menuItemNode(item: Item, currency: string | null) {
  const diets = resolveTags(item.tags)
    .map((tag) => DIET_URL[tag.key])
    .filter((url): url is string => !!url);

  const price = Number(item.price);

  return {
    "@type": "MenuItem",
    name: item.name,
    ...(describeItem(item) ? { description: describeItem(item) } : {}),
    ...(Number.isFinite(price) && price > 0
      ? {
          offers: {
            "@type": "Offer",
            price: price.toFixed(2),
            ...(currency ? { priceCurrency: currency.toUpperCase() } : {}),
          },
        }
      : {}),
    ...(diets.length > 0 ? { suitableForDiet: diets } : {}),
  };
}

export function menuJsonLd({
  slug,
  name,
  categories,
  currency,
}: {
  slug: string;
  name: string;
  categories: Category[];
  currency: StripeCurrency | null;
}): Record<string, unknown> | null {
  const sections = categories
    .filter((category) => category.items.length > 0)
    .map((category) => ({
      "@type": "MenuSection",
      name: category.name,
      hasMenuItem: category.items.map((item) => menuItemNode(item, currency)),
    }));

  if (sections.length === 0) return null;

  const menuUrl = venueUrl(slug, "/menu");

  return {
    "@context": "https://schema.org",
    "@type": "Menu",
    "@id": `${menuUrl}#menu`,
    name: `Menu · ${name}`,
    url: menuUrl,
    inLanguage: "en",
    hasMenuSection: sections,
    isPartOf: { "@id": `${venueUrl(slug)}#restaurant` },
  };
}
