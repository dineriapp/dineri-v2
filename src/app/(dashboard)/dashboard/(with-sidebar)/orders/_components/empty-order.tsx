import { ShoppingBag } from "lucide-react";

export const EmptyOrders = ({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) => (
    <div className="px-6 py-16 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-background">
            <ShoppingBag className="h-5 w-5 text-muted-foreground" />
        </div>
        <h3 className="mt-4 font-inter-tight text-base font-semibold">{hasFilters ? "No orders match your filters" : "No orders yet"}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
            {hasFilters ? "Try adjusting search or filters to see more results." : "When customers place orders, they will appear here in real time."}
        </p>
        {hasFilters && (
            <button onClick={onClear} className="mt-4 inline-flex items-center gap-1 rounded-lg border border-white/10 bg-background px-3 py-1.5 text-xs hover:border-white/20">
                Clear filters
            </button>
        )}
    </div>
);
