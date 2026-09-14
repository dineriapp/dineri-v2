import type { Addon } from "@/lib/types";

export type ResolvedAddon = { label: string; price: number };

export type AddonResolution =
  { ok: true; addons: ResolvedAddon[]; total: number } | { ok: false; error: string };

function key(label: string): string {
  return label.trim().toLowerCase();
}

export function buildAddonIndex(addons: Addon[] | null | undefined): Map<string, ResolvedAddon> {
  return new Map(
    (addons ?? []).map((a) => [key(a.label), { label: a.label, price: Number(a.price) }]),
  );
}

export function resolveAddons(
  submitted: readonly { label: string }[],
  index: ReadonlyMap<string, ResolvedAddon>,
  itemName: string,
): AddonResolution {
  const addons: ResolvedAddon[] = [];
  const seen = new Set<string>();

  for (const entry of submitted) {
    const k = key(entry.label);

    const known = index.get(k);
    if (!known) {
      return {
        ok: false,
        error: `"${entry.label}" is not an available option for ${itemName}.`,
      };
    }

    if (seen.has(k)) {
      return {
        ok: false,
        error: `"${known.label}" was selected more than once for ${itemName}.`,
      };
    }
    seen.add(k);

    addons.push({ label: known.label, price: known.price });
  }

  return { ok: true, addons, total: addons.reduce((sum, a) => sum + a.price, 0) };
}
