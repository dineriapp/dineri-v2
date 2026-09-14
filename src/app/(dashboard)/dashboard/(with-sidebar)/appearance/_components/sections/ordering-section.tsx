import { AppearanceSettings, UpdateFunctionType } from "@/lib/types/appearnace";
import { Eye, EyeOff, GripVertical, LayoutList, LinkIcon } from "lucide-react";
import React, { useState } from "react";
import { Card } from "../jsx-utils";
import { SECTION_ICON, SECTION_LABEL } from "../utils";
import { ICON_REGISTRY } from "@/utils/links";
import { IconKey } from "@/lib/types/links";

type DragKind = "link" | "section";

type Props = {
  appearance: AppearanceSettings;
  update: UpdateFunctionType;
};

const OrderingSection = ({ appearance, update }: Props) => {
  const [drag, setDrag] = useState<{ kind: DragKind; id: string } | null>(null);

  const reorder = <T extends { id: string }>(arr: T[], fromId: string, toId: string): T[] => {
    const next = [...arr];
    const from = next.findIndex((x) => x.id === fromId);
    const to = next.findIndex((x) => x.id === toId);
    if (from < 0 || to < 0) return arr;
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return next;
  };

  const onDragStart = (kind: DragKind, id: string) => setDrag({ kind, id });
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (kind: DragKind, overId: string) => {
    if (!drag || drag.kind !== kind || drag.id === overId) return setDrag(null);
    if (kind === "section") {
      update("sections", reorder(appearance.sections, drag.id, overId));
    }
    if (kind === "link") {
      update("links", reorder(appearance.links, drag.id, overId));
    }
    setDrag(null);
  };

  const updateSection = (id: string, enabled: boolean) =>
    update(
      "sections",
      appearance.sections.map((s) => (s.id === id ? { ...s, enabled } : s)),
    );
  const updateLink = (id: string, enabled: boolean) =>
    update(
      "links",
      appearance.links.map((s) => (s.id === id ? { ...s, enabled } : s)),
    );

  return (
    <Card
      icon={LayoutList}
      title="Layout & order"
      desc="Drag any section to reorder. Drag links inside the Links block. Toggle to show or hide."
    >
      <ul className="space-y-2">
        {appearance.sections.map((s) => {
          const Ic = SECTION_ICON[s.kind];
          const dragging = drag?.kind === "section" && drag.id === s.id;
          const isLinks = s.kind === "links";
          return (
            <li key={s.id}>
              <div
                draggable
                onDragStart={() => onDragStart("section", s.id)}
                onDragOver={onDragOver}
                onDrop={() => onDrop("section", s.id)}
                onDragEnd={() => setDrag(null)}
                className={`flex items-center gap-3 rounded-xl border bg-surface-1 p-3 transition ${dragging ? "border-lime/60 opacity-60" : "border-white/10 hover:border-white/25"}`}
              >
                <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground" />
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-lime/15 text-lime">
                  <Ic className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="w-full bg-transparent text-sm font-semibold text-foreground outline-none">
                    {" "}
                    {s.title}{" "}
                  </p>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {SECTION_LABEL[s.kind]}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => updateSection(s.id, !s.enabled)}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition ${s.enabled ? "border-lime/40 bg-lime/10 text-lime" : "border-white/10 bg-surface-1 text-muted-foreground"}`}
                  aria-label={s.enabled ? "Hide" : "Show"}
                >
                  {s.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>

              {/* Nested link DnD when this section is the Links container */}
              {isLinks && s.enabled && (
                <ul className="ml-6 mt-2 space-y-2 border-l border-white/10 pl-4">
                  {appearance.links.map((l) => {
                    const LIc = ICON_REGISTRY?.[l.iconKey as IconKey]?.Icon ?? LinkIcon;
                    const lDragging = drag?.kind === "link" && drag.id === l.id;
                    return (
                      <li
                        key={l.id}
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation();
                          onDragStart("link", l.id);
                        }}
                        onDragOver={onDragOver}
                        onDrop={(e) => {
                          e.stopPropagation();
                          onDrop("link", l.id);
                        }}
                        onDragEnd={() => setDrag(null)}
                        className={`flex items-center gap-3 rounded-lg border bg-surface-1/60 p-2.5 transition ${lDragging ? "border-lime/60 opacity-60" : "border-white/10 hover:border-white/25"}`}
                      >
                        <GripVertical className="h-3.5 w-3.5 shrink-0 cursor-grab text-muted-foreground" />
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-lime/15 text-lime">
                          <LIc className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="w-full bg-transparent text-xs font-semibold text-foreground outline-none">
                            {" "}
                            {l.title}
                          </p>
                          {l.sub && (
                            <p className="w-full bg-transparent text-[10px] text-muted-foreground outline-none">
                              {l.sub ?? ""}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => updateLink(l.id, !l.enabled)}
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition ${l.enabled ? "border-lime/40 bg-lime/10 text-lime" : "border-white/10 bg-surface-1 text-muted-foreground"}`}
                          aria-label={l.enabled ? "Hide" : "Show"}
                        >
                          {l.enabled ? (
                            <Eye className="h-3.5 w-3.5" />
                          ) : (
                            <EyeOff className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-[11px] text-muted-foreground">
        All blocks (Links, Menu, Events, Gallery, Success Stories, FAQ) are managed here. Changes
        reflect live in the preview.
      </p>
    </Card>
  );
};

export default OrderingSection;
