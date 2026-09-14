type BaseEmailProps = {
  to: string | string[];
  subject: string;
  html: string;
  delay?: number;
};

export type PlatformEmailProps = BaseEmailProps & {
  type: "platform";
};

export type RestaurantEmailProps = BaseEmailProps & {
  type: "restaurant";
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUsername: string;
  smtpPassword: string;
  fromEmail: string;
  fromName?: string;
};

type SendEmailProps = PlatformEmailProps | RestaurantEmailProps;

type SendEmailResult = { success: true; error: null } | { success: false; error: string };

const REQUEST_TIMEOUT_MS = 5000;

const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 300;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveEndpoint(): { url: string; apiKey: string } | { error: string } {
  const base = process.env.EMAIL_SERVICE_URL;
  const apiKey = process.env.EMAIL_SERVICE_KEY;

  if (!base) return { error: "EMAIL_SERVICE_URL is not set." };
  if (!apiKey) return { error: "EMAIL_SERVICE_KEY is not set." };

  let parsed: URL;
  try {
    parsed = new URL(base);
  } catch {
    return { error: "EMAIL_SERVICE_URL is not a valid URL." };
  }

  const isLoopback = ["localhost", "127.0.0.1", "[::1]", "::1"].includes(parsed.hostname);
  if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:" && !isLoopback) {
    return {
      error: "EMAIL_SERVICE_URL must use https in production; refusing to send credentials.",
    };
  }

  return { url: `${base.replace(/\/+$/, "")}/send-email`, apiKey };
}

function isRetryable(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

export async function publishEmailToQueue(props: SendEmailProps): Promise<SendEmailResult> {
  const endpoint = resolveEndpoint();
  if ("error" in endpoint) {
    console.error("Email service misconfigured:", endpoint.error);
    return { success: false, error: endpoint.error };
  }

  let lastError = "Failed to publish email to queue.";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": endpoint.apiKey,
        },
        body: JSON.stringify(props),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      const result = await response.json().catch(() => null);

      if (response.ok && result?.success) {
        return { success: true, error: null };
      }

      lastError = result?.error || `Email service responded ${response.status}.`;
      if (!isRetryable(response.status)) {
        return { success: false, error: lastError };
      }
    } catch (err: unknown) {
      lastError =
        err instanceof Error
          ? err.name === "TimeoutError"
            ? `Email service did not respond within ${REQUEST_TIMEOUT_MS}ms.`
            : err.message
          : "Unexpected error publishing email.";
    }

    if (attempt < MAX_ATTEMPTS) {
      await sleep(RETRY_BASE_DELAY_MS * attempt);
    }
  }

  console.error(`Email publish failed after ${MAX_ATTEMPTS} attempts:`, lastError);
  return { success: false, error: lastError };
}
