export type Data = {
    venue: string;
    cuisine: string;
    city: string;
    phone: string;
    // branding
    brandColor: string;
    vibe: "minimal" | "warm" | "bold";
    // hours 
    hoursFrom: string;
    hoursTo: string;
    closedDays: string[];
    // menu
    menuSize: "small" | "medium" | "large";
    importMethod: "manual" | "pdf" | "link";
    goal: string;
    // Audience 
    diners: string[];           // who comes in: couples, families, tourists...
    dietary: string[];          // vegan, gluten-free, halal...
    topCategories: string[];    // pizza, burgers, cocktails...
    peakTimes: string[];        // weekday lunch, friday dinner...
    avgSpend: "under15" | "15to30" | "30to60" | "over60";
    channels: string[];         // dine-in, pickup, delivery, reservations
    priorities: string[];       // what diners care about most
    painPoints: string[];       // venue's biggest challenges
    npsAsk: boolean;            // ask customers for feedback
};
