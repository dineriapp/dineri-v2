"use client";

import { useEvents } from "@/lib/tanstack-react-query/hooks/events";
import { useFaqCategoryWithItems } from "@/lib/tanstack-react-query/hooks/faq";
import { useRestaurantGalleryItems } from "@/lib/tanstack-react-query/hooks/gallery";
import { useRestaurantLinks } from "@/lib/tanstack-react-query/hooks/links";
import { useSuccessStories } from "@/lib/tanstack-react-query/hooks/success-stories";
import { AppearanceSettings, DEFAULT_APPEARANCE, UpdateFunctionType } from "@/lib/types/appearnace";
import { cn } from "@/lib/utils";
import { updateSelectedRestaurant, useSelectedRestaurant } from "@/stores/restaurant-store";
import {
  ExternalLink,
  Layers,
  LayoutTemplate,
  Loader,
  MousePointerClick,
  Palette,
  PanelsTopLeft,
  RotateCcw,
  Save,
  Type,
  User,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import TopBar from "../../_components/top-bar";
import { PreviewSection } from "./_components/preview-section";
import Branding from "./_components/sections/branding";
import ButtonStylesSection from "./_components/sections/button-style";
import OrderingSection from "./_components/sections/ordering-section";
import SectionsStyles from "./_components/sections/sections-style";
import { TemplatesSection } from "./_components/sections/templates-section";
import ThemeSection from "./_components/sections/theme-section";
import TypographySection from "./_components/sections/typography-section";
import { updateRestaurantAppearance } from "./actions";
import { useMenuCategoryWithItems } from "@/lib/tanstack-react-query/hooks/menu";
import { useRestaurantPopups } from "@/lib/tanstack-react-query/hooks/popups";
import { useGoogleRating } from "@/lib/tanstack-react-query/hooks/google-rating";

const tabs = [
  {
    id: "templates",
    label: "Templates",
    icon: LayoutTemplate,
  },
  {
    id: "header",
    label: "Header",
    icon: User,
  },
  {
    id: "wallpaper",
    label: "Wallpaper",
    icon: Palette,
  },
  {
    id: "buttons",
    label: "Buttons",
    icon: MousePointerClick,
  },
  {
    id: "sections",
    label: "Sections",
    icon: Layers,
  },
  {
    id: "typography",
    label: "Typography",
    icon: Type,
  },

  {
    id: "layout",
    label: "Layout",
    icon: PanelsTopLeft,
  },
] as const;
export type TabId = (typeof tabs)[number]["id"];

const Page = () => {
  const [activeTab, setActiveTab] = useState<TabId>("templates");
  const { data: links = [], isPending: linksPending } = useRestaurantLinks();
  const { data: events = [], isPending: eventsPending } = useEvents();
  const { data: faqs = [], isPending: faqsPending } = useFaqCategoryWithItems();
  const { data: successStories = [], isPending: storiesPending } = useSuccessStories();
  const { data: galleryItems = [], isPending: galleryPending } = useRestaurantGalleryItems();
  const { data: menuiCategories = [], isPending: menuPending } = useMenuCategoryWithItems();
  const { data: popups = [] } = useRestaurantPopups();
  const { data: googleRating } = useGoogleRating();

  const isPending =
    linksPending || eventsPending || faqsPending || storiesPending || galleryPending || menuPending;

  const [isLoading, startTransition] = useTransition();
  const selectedRestaurant = useSelectedRestaurant();
  const [brandingData, setBrandingData] = useState({
    name: selectedRestaurant?.name ?? "",
    tagline: selectedRestaurant?.tagline ?? "",
    bio: selectedRestaurant?.bio ?? "",
  });

  const [appearanceData, setAppearanceData] = useState<AppearanceSettings>(
    selectedRestaurant?.appearance_settings ?? DEFAULT_APPEARANCE,
  );

  const [branding, setBranding] = useState({
    name: selectedRestaurant?.name ?? "",
    tagline: selectedRestaurant?.tagline ?? "",
    bio: selectedRestaurant?.bio ?? "",
  });
  const [appearance, setAppearance] = useState<AppearanceSettings>(
    selectedRestaurant?.appearance_settings ?? DEFAULT_APPEARANCE,
  );

  const HandleReset = () => {
    if (selectedRestaurant) {
      setBranding({
        name: selectedRestaurant.name ?? "",
        tagline: selectedRestaurant.tagline ?? "",
        bio: selectedRestaurant.bio ?? "",
      });
      setAppearance(selectedRestaurant.appearance_settings);
    }
  };
  const HandleCompleteReset = () => {
    if (selectedRestaurant) {
      setBranding({
        name: selectedRestaurant.name ?? "",
        tagline: selectedRestaurant.tagline ?? "",
        bio: selectedRestaurant.bio ?? "",
      });
      setAppearance((prev) => ({
        ...DEFAULT_APPEARANCE,
        bg_image: prev.bg_image,
        cover_image: prev.cover_image,
      }));
    }
  };
  const hasChanges = useMemo(() => {
    return (
      JSON.stringify(branding) !== JSON.stringify(brandingData) ||
      JSON.stringify(appearance) !== JSON.stringify(appearanceData)
    );
  }, [branding, appearance, brandingData, appearanceData]);

  const handleSave = async () => {
    startTransition(async () => {
      const res = await updateRestaurantAppearance(branding, appearance);
      if (res.error) {
        toast.error(res.error ?? "Error");
      }
      if (res.data) {
        updateSelectedRestaurant({
          appearance_settings: res.data.appearance_settings,
          name: res.data.branding.name,
          bio: res.data.branding.bio,
          tagline: res.data.branding.tagline,
        });
        setAppearance(res.data.appearance_settings);
        setBranding({
          name: res.data.branding.name,
          bio: res.data.branding.bio,
          tagline: res.data.branding.tagline,
        });
        setBrandingData({
          name: res.data.branding.name,
          bio: res.data.branding.bio,
          tagline: res.data.branding.tagline,
        });
        setAppearanceData(res.data.appearance_settings);
        toast.success("Saved!");
      }
    });
  };

  const update: UpdateFunctionType = (key, value) => {
    setAppearance((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <>
      <TopBar page="Appearance" />
      <div className="p-4 sm:p-6 lg:flex lg:h-[calc(100svh-4rem)] lg:flex-col lg:overflow-hidden">
        <section className="lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 lg:shrink-0">
            <div>
              <div className="font-jetbrains-mono uppercase text-[10px] tracking-wider text-muted-foreground">
                APPEARANCE
              </div>
              <h1 className="font-inter-tight mt-1 text-2xl font-semibold">
                Design your public page
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Customize colors, typography, buttons and link order. Save updates the live preview;
                Publish pushes them to your public page.
              </p>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
              <Link
                href="/preview"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-surface-1 px-3 py-2 text-xs font-medium text-foreground hover:border-white/20 sm:py-1.5"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Open public page
              </Link>
              <button
                onClick={() => {
                  HandleCompleteReset();
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-surface-1 px-3 py-2 text-xs font-medium text-foreground hover:border-white/20 sm:py-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset to default
              </button>
              <button
                onClick={() => {
                  HandleReset();
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-surface-1 px-3 py-2 text-xs font-medium text-foreground hover:border-white/20 sm:py-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset changes
              </button>
              <button
                disabled={!hasChanges || isLoading}
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 rounded-full bg-lime px-4 py-2 text-xs font-semibold text-[#0b0d10] disabled:opacity-50 sm:py-1.5"
              >
                {isLoading ? (
                  <>
                    <Loader className="h-3.5 w-3.5 animate-spin" /> Saving
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" /> Save
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:mt-6 sm:gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_380px]">
            {/* Editor */}
            <div className="space-y-4 sm:space-y-6 lg:min-h-0 lg:overflow-hidden">
              <div className="w-full  grid grid-cols-1 gap-3 md:grid-cols-[200px_1fr] lg:h-full lg:min-h-0">
                {/* Horizontal scrolling tab strip on mobile, sidebar from md */}
                <div className="w-full h-full relative">
                  {/* `sticky` still earns its keep between md and lg, where the
                      page scrolls as a document. From lg the rail's column no
                      longer scrolls, so it holds position on its own. */}
                  <div className="-mx-1 flex sticky top-6 left-0  w-[calc(100%+0.5rem)] gap-2 overflow-x-auto px-1 pb-1 md:mx-0 md:w-full md:flex-col md:overflow-x-visible md:pb-0 lg:static">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;

                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={cn(
                            "flex shrink-0 items-center gap-2 whitespace-nowrap cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium transition-all md:gap-3 md:px-4 md:py-3",
                            activeTab === tab.id
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "hover:bg-muted",
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="lg:min-h-0 lg:overflow-y-auto lg:pr-1 scrollbar-dark">
                  {activeTab === "templates" && (
                    <div className="templates">
                      <TemplatesSection appearance={appearance} update={update} />
                    </div>
                  )}
                  {activeTab === "header" && (
                    <div key="branding">
                      <Branding
                        branding={branding}
                        setBranding={setBranding}
                        appearance={appearance}
                        update={update}
                      />
                    </div>
                  )}
                  {activeTab === "wallpaper" && (
                    <div key="theme">
                      <ThemeSection appearance={appearance} update={update} />
                    </div>
                  )}
                  {activeTab === "buttons" && (
                    <div key="buttons">
                      <ButtonStylesSection appearance={appearance} update={update} />
                    </div>
                  )}
                  {activeTab === "sections" && (
                    <div key="sections">
                      <SectionsStyles appearance={appearance} update={update} />
                    </div>
                  )}
                  {activeTab === "typography" && (
                    <div key="typography">
                      <TypographySection appearance={appearance} update={update} />
                    </div>
                  )}
                  {activeTab === "layout" && (
                    <div key="ordering">
                      <OrderingSection appearance={appearance} update={update} />
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Live preview */}
            {/* Its own scroll region now, so it no longer has to be sticky. */}
            <div className="lg:min-h-0 lg:pr-1 ">
              <div className="font-jetbrains-mono uppercase mb-2 text-[10px] tracking-wider text-muted-foreground lg:shrink-0">
                LIVE PREVIEW
              </div>
              <PreviewSection
                settings={appearance}
                restaurant={selectedRestaurant}
                branding={{ ...branding, image: selectedRestaurant?.logo?.url ?? "" }}
                links={links}
                isSlugPage={false}
                isLoading={isPending}
                events={events}
                faqs={faqs}
                successStories={successStories}
                galleryItems={galleryItems}
                menu={menuiCategories}
                popups={popups}
                googleRating={googleRating}
              />
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Page;
