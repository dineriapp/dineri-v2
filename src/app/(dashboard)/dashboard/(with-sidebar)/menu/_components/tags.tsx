"use client";

import { memo } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { TAG_ICONS } from "@/utils/tag-icons";
import { GROUP_LABEL, TAG_GROUPS, TagKey, tagsInGroup } from "@/utils/tags";
import { MenuItemSchemaType } from "@/lib/validators/zod/menu-scheam";

const Tags = memo(() => {
  const { setValue, control } = useFormContext<MenuItemSchemaType>();

  const selectedTags =
    useWatch({
      control,
      name: "tags",
    }) ?? [];

  const toggleTag = (tag: TagKey) => {
    const exists = selectedTags.includes(tag);

    setValue("tags", exists ? selectedTags.filter((t) => t !== tag) : [...selectedTags, tag], {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <div className="space-y-3">
      {TAG_GROUPS.map((group) => (
        <div key={group}>
          <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
            {GROUP_LABEL[group]}
            {group === "allergen" && (
              <span className="ml-1.5 font-normal opacity-70">
                shown to guests as an allergy warning
              </span>
            )}
          </label>

          <div className="flex flex-wrap gap-2">
            {tagsInGroup(group).map((tag) => {
              const Icon = TAG_ICONS[tag.key];
              const active = selectedTags.includes(tag.key);

              return (
                <button
                  key={tag.key}
                  type="button"
                  onClick={() => toggleTag(tag.key)}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition ${
                    active
                      ? "border-white/40 bg-white/10 text-white"
                      : "border-white/10 text-muted-foreground hover:border-white/20"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {tag.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
});

Tags.displayName = "Tags";

export default Tags;
