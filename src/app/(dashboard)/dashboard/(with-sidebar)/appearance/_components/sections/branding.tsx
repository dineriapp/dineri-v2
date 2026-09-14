import { MultiImageUploader } from "@/components/shared/image-uploader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { AppearanceSettings, FontWeight, UpdateFunctionType } from "@/lib/types/appearnace";
import { cn, getS3KeyFromUrl } from "@/lib/utils";
import { ImageIcon, Type, UploadCloud, UserRound } from "lucide-react";
import { Card, Field, Label } from "../jsx-utils";
import { FONT_OPTIONS, input_class } from "../utils";
export type BrandingData = {
    name: string;
    tagline: string;
    bio: string;
};

interface BrandingProps {
    branding: BrandingData;
    setBranding: React.Dispatch<
        React.SetStateAction<BrandingData>
    >;
    appearance: AppearanceSettings;
    update: UpdateFunctionType;
}
const Branding = ({
    branding,
    setBranding,
    appearance,
    update
}: BrandingProps) => {
    return (
        <Card icon={Type} title="Header" desc="Name, tagline and intro that appear at the top.">
            <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                    <Field label="Venue name">
                        <input
                            value={branding.name}
                            className={input_class}
                            onChange={(e) =>
                                setBranding((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                }))
                            }
                        />
                    </Field>
                    <Field label="Tagline">
                        <input
                            value={branding.tagline}
                            className={input_class}
                            onChange={(e) =>
                                setBranding((prev) => ({
                                    ...prev,
                                    tagline: e.target.value,
                                }))
                            }
                        />
                    </Field>
                    <Field label="Bio" className="col-span-2">
                        <input
                            value={branding.bio}
                            className={input_class}
                            onChange={(e) =>
                                setBranding((prev) => ({
                                    ...prev,
                                    bio: e.target.value,
                                }))
                            }
                        />
                    </Field>
                </div>
                <Field label="Layout">
                    <div className="grid grid-cols-2 gap-2 max-w-100">
                        <button
                            type="button"
                            onClick={() => update("header_layout", "classic")}
                            className={cn(
                                "rounded-xl border p-4 transition-all",
                                appearance.header_layout === "classic"
                                    ? "border-primary bg-primary/5"
                                    : "hover:border-muted-foreground/30"
                            )}
                        >
                            <div className="mb-3 flex justify-center">
                                <div className="flex flex-col items-center">
                                    <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                                        <UserRound className="h-6 w-6" />
                                    </div>
                                    <div className="mt-2 h-2 w-20 rounded bg-muted" />
                                    <div className="mt-1 h-2 w-14 rounded bg-muted" />
                                </div>
                            </div>

                            <div className="text-sm font-medium">Classic</div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Profile picture only
                            </p>
                        </button>

                        <button
                            type="button"
                            onClick={() => update("header_layout", "banner")}
                            className={cn(
                                "rounded-xl border p-4 transition-all",
                                appearance.header_layout === "banner"
                                    ? "border-primary bg-primary/5"
                                    : "hover:border-muted-foreground/30"
                            )}
                        >
                            <div className="mb-3 flex justify-center">
                                <div className="w-full max-w-30">
                                    <div className="h-8 rounded-t-md bg-muted" />
                                    <div className="-mt-3 flex justify-center">
                                        <div className="h-10 w-10 rounded-full border-2 border-background bg-muted flex items-center justify-center">
                                            <ImageIcon className="h-4 w-4" />
                                        </div>
                                    </div>
                                    <div className="mt-2 h-2 w-20 mx-auto rounded bg-muted" />
                                </div>
                            </div>

                            <div className="text-sm font-medium">Banner</div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Cover image + profile picture
                            </p>
                        </button>
                    </div>
                </Field>
                {appearance.header_layout === "banner" && (
                    <>
                        <div className="w-full">
                            <Label >Banner image</Label>
                            <div className='mt-2'>
                                <MultiImageUploader
                                    value={appearance.cover_image ? [{ url: appearance.cover_image, key: getS3KeyFromUrl(appearance.cover_image) }] : []}
                                    onChange={(data) => {
                                        update("cover_image", data?.[0]?.url)
                                    }}
                                    gridClassName="grid-cols-1 gap-3"
                                    PreviewItemClassName="aspect-20/7! rounded-md"
                                    maxFiles={1}
                                    className="w-full max-w-50"
                                    triggerClassName='w-full max-w-50'
                                    showLimit={false}
                                >
                                    <div
                                        className="aspect-20/7! cursor-pointer w-full flex items-center justify-center flex-col"
                                    >
                                        <UploadCloud />
                                    </div>
                                </MultiImageUploader>
                            </div>

                            <p className="mt-2 text-[11px] text-muted-foreground">
                                Upload a photo to use as your cover image.
                            </p>
                        </div>
                    </>

                )}
                <Field label="Alternative title font" className="">
                    <Select
                        value={appearance.alternative_title_font}
                        onValueChange={(value) => {
                            if (value === "none") {
                                update("alternative_title_font", undefined as AppearanceSettings["alternative_title_font"])
                            } else {
                                update("alternative_title_font", value as AppearanceSettings["alternative_title_font"])
                            }
                        }
                        }
                    >
                        <SelectTrigger className="w-full rounded-sm bg-transparent">
                            <SelectValue placeholder="Select alternative title font" />
                        </SelectTrigger>

                        <SelectContent>
                            <SelectItem key={"none"} value={"none"}>
                                <span style={{ fontFamily: "" }}>
                                    None
                                </span>
                            </SelectItem>
                            {FONT_OPTIONS.map((font) => (
                                <SelectItem key={font.id} value={font.id}>
                                    <span style={{ fontFamily: font.stack }}>
                                        {font.label}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>
                <div className=" grid gap-3 md:grid-cols-2">
                    <Field label="Title color">
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={appearance.heading_color}
                                onChange={(e) => update("heading_color", e.target.value)}
                                className="h-10 w-12"
                            />
                            <input
                                className={input_class}
                                value={appearance.heading_color}
                                onChange={(e) => update("heading_color", e.target.value)}
                            />
                        </div>
                    </Field>
                    <Field label="Text color">
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={appearance.text_color}
                                onChange={(e) => update("text_color", e.target.value)}
                                className="h-10 w-12 cursor-pointer rounded-lg border border-white/10 bg-transparent"
                            />
                            <input
                                className={input_class}
                                value={appearance.text_color}
                                maxLength={9}
                                onChange={(e) => update("text_color", e.target.value)}
                            />
                        </div>
                    </Field>
                </div>
                {/* Header Typography */}
                <div className="space-y-4">
                    <Field label={`Heading Size (${appearance.sectionHeaderFontSize}px)`}>
                        <Slider
                            min={10}
                            max={32}
                            step={1}
                            value={[appearance.sectionHeaderFontSize]}
                            onValueChange={([v]) =>
                                update("sectionHeaderFontSize", v)
                            }
                        />
                    </Field>
                    <Field label={`Heading Weight (${appearance.sectionHeaderFontWeight})`}>
                        <Select
                            value={String(appearance.sectionHeaderFontWeight)}
                            onValueChange={(value) => {
                                update(
                                    "sectionHeaderFontWeight",
                                    Number(value) as FontWeight
                                )
                            }
                            }
                        >
                            <SelectTrigger className="w-full rounded-sm bg-transparent">
                                <SelectValue placeholder="Select alternative title font" />
                            </SelectTrigger>

                            <SelectContent>
                                {[
                                    { label: "Regular", value: `400` },
                                    { label: "Medium", value: `500` },
                                    { label: "Semibold", value: `600` },
                                    { label: "Bold", value: `700` },
                                    { label: "Extrabold", value: `800` },
                                ].map((font) => (
                                    <SelectItem key={font.label} value={font.value}>
                                        <span >
                                            {font.label}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                </div>
                <Field label="Picture Radius" className="">
                    <Slider
                        min={0}
                        max={50}
                        step={1}
                        value={[appearance.profilePicRadius ?? 16]}
                        onValueChange={([v]) => update("profilePicRadius", v)}
                        className="h-1.5"
                    />
                    <span className="text-xs text-muted-foreground mt-0.5">
                        {appearance.profilePicRadius ?? 16}px
                    </span>
                </Field>
            </div>
        </Card>
    )
}

export default Branding
