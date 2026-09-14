"use client";
import { toast } from "sonner";
import { AnimatePresence, motion } from "motion/react";
import { Loader } from "lucide-react";
export const StickySaveBar = ({
  dirty,
  onDiscard,
  disabled = false,
  loading = false,
  label = "Save changes",
  onSubmit,
}: {
  dirty: boolean;
  disabled?: boolean;
  loading?: boolean;
  onDiscard: () => void;
  onSubmit?: () => void;
  label?: string;
}) => (
  <AnimatePresence>
    {dirty && (
      <motion.div
        initial={{
          opacity: 0,
          y: 20,
          scale: 0.96,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        exit={{
          opacity: 0,
          y: 20,
          scale: 0.96,
        }}
        transition={{
          duration: 0.25,
          ease: "easeOut",
        }}
        className="sticky bottom-4 mt-6 flex justify-end"
      >
        <div className="pointer-events-auto flex w-full items-center gap-2 rounded-full border border-white/10 bg-background/90 p-2 shadow-elevated backdrop-blur sm:w-auto sm:gap-3 sm:py-2 sm:pl-4 sm:pr-2">
          <span className="hidden items-center gap-1.5 pl-2 text-xs text-muted-foreground sm:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
            Unsaved changes
          </span>

          <button
            type="button"
            onClick={() => {
              onDiscard();
              toast("Changes discarded");
            }}
            className="flex-1 rounded-full px-3 py-2 text-xs text-muted-foreground hover:text-foreground sm:flex-none sm:py-1.5"
          >
            Discard
          </button>

          <button
            type={onSubmit ? "button" : "submit"}
            disabled={disabled}
            onClick={() => {
              onSubmit?.();
            }}
            className="flex-1 cursor-pointer rounded-full flex items-center justify-center gap-1 bg-white px-4 py-2 text-xs font-semibold text-background hover:bg-white/90 sm:flex-none sm:py-1.5"
          >
            {loading && <Loader className="animate-spin size-4" />}
            {label}
          </button>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);
