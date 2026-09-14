import { IconKey } from "@/lib/types/links";
import {
    CalendarDays,
    Globe,
    Link as LinkIcon,
    Mail,
    MapPin,
    MessageCircle,
    Music2,
    Phone,
    ShoppingBag,
    UtensilsCrossed
} from "lucide-react";
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube } from "react-icons/fa";

export const ICON_REGISTRY: Record<IconKey, { label: string; Icon: React.ElementType }> = {
    website: { label: "Website", Icon: Globe },
    location: { label: "Location", Icon: MapPin },
    menu: { label: "Menu", Icon: UtensilsCrossed },
    event: { label: "Event", Icon: CalendarDays },
    phone: { label: "Phone", Icon: Phone },
    email: { label: "Email", Icon: Mail },
    shop: { label: "Shop / Order", Icon: ShoppingBag },
    instagram: { label: "Instagram", Icon: FaInstagram },
    facebook: { label: "Facebook", Icon: FaFacebook },
    twitter: { label: "Twitter / X", Icon: FaTwitter },
    youtube: { label: "YouTube", Icon: FaYoutube },
    tiktok: { label: "TikTok", Icon: Music2 },
    whatsapp: { label: "WhatsApp", Icon: MessageCircle },
    spotify: { label: "Spotify", Icon: Music2 },
    link: { label: "Generic link", Icon: LinkIcon },
};

export const ICON_OPTIONS = (Object.keys(ICON_REGISTRY) as IconKey[]).map((k) => ({
    value: k,
    label: ICON_REGISTRY[k].label,
}));