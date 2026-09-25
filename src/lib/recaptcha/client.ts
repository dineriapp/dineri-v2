"use client";

type Grecaptcha = {
  ready: (cb: () => void) => void;
  execute: (siteKey: string, options: { action: string }) => Promise<string>;
};

declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
const SCRIPT_ID = "recaptcha-v3";

let loading: Promise<Grecaptcha> | null = null;

function loadRecaptcha(): Promise<Grecaptcha> {
  if (!SITE_KEY) {
    return Promise.reject(new Error("NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not set"));
  }
  if (loading) return loading;

  loading = new Promise<Grecaptcha>((resolve, reject) => {
    const onReady = () => window.grecaptcha!.ready(() => resolve(window.grecaptcha!));

    if (window.grecaptcha) return onReady();

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    script.async = true;
    script.onload = onReady;
    script.onerror = () => {
      loading = null;
      script.remove();
      reject(new Error("Failed to load reCAPTCHA"));
    };
    document.head.appendChild(script);
  });

  return loading;
}

export function preloadRecaptcha(): void {
  loadRecaptcha().catch(() => {});
}

export async function captchaHeaders(action: string): Promise<{ "x-captcha-response": string }> {
  const grecaptcha = await loadRecaptcha();
  const token = await grecaptcha.execute(SITE_KEY!, { action });
  return { "x-captcha-response": token };
}
