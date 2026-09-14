"use client";
import { GalleryType } from "@/drizzle/types";
import { cn } from "@/lib/utils";
import { getYoutubeId } from "@/lib/validators/zod/gallery.schema";
import { ImageIcon, PlayIcon, Video } from "lucide-react";

export const PhonePreview = ({ items }: { items: GalleryType[] }) => {
  const visible = items.filter((i) => i.active);
  return (
    <div className="dash-card sticky top-6 hidden rounded-3xl border border-white/10 bg-surface-1 p-5 lg:block">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="font-jetbrains-mono uppercase text-[10px] tracking-wider text-muted-foreground">
            Preview
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            How the gallery looks on your link page.
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-background px-2 py-0.5 text-[10px] text-muted-foreground">
          {visible.length} tile{visible.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="mx-auto w-65 rounded-[28px] border border-white/15 bg-background p-3 shadow-2xl">
        <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-white/10" />
        <div className="rounded-2xl border border-white/5 bg-surface-2 p-3">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[11px] font-bold text-background">
              D
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold">@dineri</div>
              <div className="font-jetbrains-mono uppercase text-[8px] text-muted-foreground">
                Gallery
              </div>
            </div>
          </div>
          {visible.length === 0 ? (
            <div className="rounded-lg border border-dashed border-white/10 p-4 text-center text-[10px] text-muted-foreground">
              Nothing visible yet.
            </div>
          ) : (
            <div
              className={cn(
                "gap-2 grid",
                visible.length === 1
                  ? " grid-cols-1"
                  : visible.length === 2
                    ? " grid-cols-2"
                    : " grid-cols-3",
              )}
            >
              {visible.slice(0, 6).map((i) => (
                <div
                  key={i.id}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-white/5 bg-background"
                >
                  {(() => {
                    if (i.type === "image") {
                      return i.image?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={i.image.url}
                          alt={i.title || "Gallery image"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                          <ImageIcon className="h-4 w-4" />
                        </div>
                      );
                    } else {
                      const youtubeId = getYoutubeId(i.youtube_url ?? "");
                      const hasYoutubeId = !!youtubeId;
                      const youtubeThumbnail = hasYoutubeId
                        ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
                        : null;
                      const customPoster = i.image?.url; // optional custom poster from DB
                      const thumbToShow = customPoster || youtubeThumbnail;
                      return thumbToShow ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumbToShow}
                          alt={i.title || "Video thumbnail"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                          <Video className="h-4 w-4" />
                        </div>
                      );
                    }
                  })()}
                  {i.type === "video" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-background/80">
                        <PlayIcon className="h-3 w-3 fill-current" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
