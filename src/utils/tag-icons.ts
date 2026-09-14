import {
  Bean,
  Beef,
  Egg,
  Fish,
  Flame,
  Leaf,
  LucideIcon,
  Milk,
  Moon,
  Nut,
  Shell,
  Sprout,
  Star,
  Wheat,
  WheatOff,
  Wine,
} from "lucide-react";

import { TagKey } from "./tags";

export const TAG_ICONS: Record<TagKey, LucideIcon> = {
  featured: Star,
  spicy: Flame,
  vegetarian: Leaf,
  vegan: Sprout,
  halal: Moon,
  gluten_free: WheatOff,
  nuts: Nut,
  dairy: Milk,
  gluten: Wheat,
  egg: Egg,
  soy: Bean,
  shellfish: Shell,
  fish: Fish,
  meat: Beef,
  alcohol: Wine,
};
