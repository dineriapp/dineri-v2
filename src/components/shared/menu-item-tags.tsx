import { AppearanceSettings } from "@/lib/types/appearnace";
import { cn } from "@/lib/utils";
import { TAG_ICONS } from "@/utils/tag-icons";
import { resolveTags } from "@/utils/tags";

export function MenuItemTags({
  tags,
  settings,
  className,
}: {
  tags: readonly string[] | null | undefined;
  settings: AppearanceSettings;
  className?: string;
}) {
  const resolved = resolveTags(tags);
  if (resolved.length === 0) return null;

  const fontSize = Math.max(9, (settings.sectionItemTextFontSize ?? 13) - 3);

  return (
    <ul
      className={cn("flex flex-wrap items-center gap-1", className)}
      aria-label="Dietary and allergy information"
    >
      {resolved.map((tag) => {
        const Icon = TAG_ICONS[tag.key];
        const isAllergen = tag.group === "allergen";

        return (
          <li
            key={tag.key}
            className="inline-flex items-center gap-1 border px-1.5 py-0.5 leading-none"
            style={{
              background: isAllergen ? settings.sectionIconBgColor : settings.sectionInIconBgColor,
              color: isAllergen ? settings.sectionIconColor : settings.sectionInIconColor,
              borderColor: isAllergen
                ? settings.sectionIconBorderColor
                : settings.sectionInIconBorderColor,
              borderRadius: `${settings.sectionInIconRadiusPx ?? 7}px`,
              fontSize: `${fontSize}px`,
            }}
          >
            <Icon className="h-2.5 w-2.5 shrink-0" aria-hidden />
            {tag.publicLabel}
          </li>
        );
      })}
    </ul>
  );
}
