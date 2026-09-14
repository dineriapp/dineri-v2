export const UTM_SOURCE_PARAM = "utm_source";
export const UTM_MEDIUM_PARAM = "utm_medium";
export const UTM_CAMPAIGN_PARAM = "utm_campaign";

export type UtmTags = {
  source: string;
  medium?: string;
  campaign?: string;
};

export const QR_TAGS: UtmTags = { source: "qr", medium: "qr" };
export const SHARE_TAGS: UtmTags = { source: "social", medium: "share" };

export function withUtm(url: string, tags: UtmTags): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  if (parsed.searchParams.has(UTM_SOURCE_PARAM)) return parsed.toString();

  parsed.searchParams.set(UTM_SOURCE_PARAM, tags.source);
  if (tags.medium) parsed.searchParams.set(UTM_MEDIUM_PARAM, tags.medium);
  if (tags.campaign) parsed.searchParams.set(UTM_CAMPAIGN_PARAM, tags.campaign);

  return parsed.toString();
}
