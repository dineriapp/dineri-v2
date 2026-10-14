import "server-only";

import { open, validate, type CityResponse, type Reader } from "maxmind";

export type Geo = { country?: string; city?: string };

const DEFAULT_DB_PATH = "/app/geoip/dbip-city-lite.mmdb";

const UNROUTABLE =
  /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|192\.0\.2\.|::1$|fe80:|f[cd])/i;

let readerPromise: Promise<Reader<CityResponse> | null> | null = null;
let warned = false;

function getReader(): Promise<Reader<CityResponse> | null> {
  const path = process.env.GEOIP_DB_PATH || DEFAULT_DB_PATH;
  readerPromise ??= open<CityResponse>(path, { cache: { max: 5000 } }).catch((err) => {
    if (!warned) {
      warned = true;
      console.warn(
        `[geoip] No IP database at ${path}; country and city will not be recorded.`,
        err instanceof Error ? err.message : err,
      );
    }
    return null;
  });
  return readerPromise;
}

export async function lookupGeo(ip: string | null | undefined): Promise<Geo> {
  try {
    if (!ip || UNROUTABLE.test(ip) || !validate(ip)) return {};

    const reader = await getReader();
    const found = reader?.get(ip);
    if (!found) return {};

    return {
      country: found.country?.iso_code ?? found.registered_country?.iso_code,
      city: found.city?.names?.en,
    };
  } catch {
    return {};
  }
}
