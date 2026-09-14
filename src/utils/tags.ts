export type TagGroup = "highlight" | "diet" | "allergen";

type TagShape = {
  key: string;
  label: string;
  publicLabel: string;
  group: TagGroup;
};

export const TAGS = [
  { key: "featured", label: "Featured", publicLabel: "Featured", group: "highlight" },
  { key: "spicy", label: "Spicy", publicLabel: "Spicy", group: "highlight" },

  // Dietary claims.
  { key: "vegetarian", label: "Vegetarian", publicLabel: "Vegetarian", group: "diet" },
  { key: "vegan", label: "Vegan", publicLabel: "Vegan", group: "diet" },
  { key: "halal", label: "Halal", publicLabel: "Halal", group: "diet" },
  { key: "gluten_free", label: "Gluten-free", publicLabel: "Gluten-free", group: "diet" },

  // Allergens and ingredients guests avoid.
  { key: "nuts", label: "Nuts", publicLabel: "Contains nuts", group: "allergen" },
  { key: "dairy", label: "Dairy", publicLabel: "Contains dairy", group: "allergen" },
  { key: "gluten", label: "Gluten", publicLabel: "Contains gluten", group: "allergen" },
  { key: "egg", label: "Egg", publicLabel: "Contains egg", group: "allergen" },
  { key: "soy", label: "Soy", publicLabel: "Contains soy", group: "allergen" },
  { key: "shellfish", label: "Shellfish", publicLabel: "Contains shellfish", group: "allergen" },
  { key: "fish", label: "Fish", publicLabel: "Contains fish", group: "allergen" },
  { key: "meat", label: "Meat", publicLabel: "Contains meat", group: "allergen" },
  { key: "alcohol", label: "Alcohol", publicLabel: "Contains alcohol", group: "allergen" },
] as const satisfies readonly TagShape[];

export type TagDefinition = (typeof TAGS)[number];

export type TagKey = TagDefinition["key"];

export const TAG_KEYS = TAGS.map((t) => t.key) as [TagKey, ...TagKey[]];

export const GROUP_LABEL: Record<TagGroup, string> = {
  highlight: "Highlights",
  diet: "Dietary",
  allergen: "Contains",
};

export const TAG_GROUPS: TagGroup[] = ["highlight", "diet", "allergen"];

export const tagsInGroup = (group: TagGroup) => TAGS.filter((t) => t.group === group);

export function resolveTags(keys: readonly string[] | null | undefined): TagDefinition[] {
  if (!Array.isArray(keys) || keys.length === 0) return [];
  const owned = new Set(keys);
  return TAGS.filter((t) => owned.has(t.key));
}

export const toTagKeys = (keys: readonly string[] | null | undefined): TagKey[] =>
  resolveTags(keys).map((t) => t.key);
