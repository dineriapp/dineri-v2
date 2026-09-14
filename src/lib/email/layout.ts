const BRAND = {
  lime: "#D4FF38",
  limeDark: "#182100",
  bg: "#0a0a0a",
  surface: "#121212",
  border: "#242424",
  text: "#ffffff",
  muted: "#9a9a9a",
  faint: "#5f5f5f",
} as const;

const FONT = "'Helvetica Neue',Arial,sans-serif";

const SOCIALS: { label: string; url: string }[] = [
  { label: "Instagram", url: "https://www.instagram.com/dineri.app" },
  { label: "X", url: "https://x.com/dineriapp" },
  { label: "LinkedIn", url: "https://linkedin.com/company/dineri-app" },
  { label: "TikTok", url: "https://www.tiktok.com/@dineri.app" },
];

function socialRow(): string {
  return SOCIALS.map(
    (s) =>
      `<a href="${s.url}" target="_blank" style="font-family:${FONT}; font-size:12px; font-weight:600; color:${BRAND.muted}; text-decoration:none;">${s.label}</a>`,
  ).join(`<span style="color:${BRAND.border}; padding:0 8px;">&bull;</span>`);
}

export function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function textToHtml(text: string): string {
  return `<div style="font-family:${FONT}; font-size:15px; line-height:1.65; color:${BRAND.muted}; white-space:pre-line;">${esc(text.trim())}</div>`;
}

export function detailRows(rows: { label: string; value: string }[]): string {
  const cells = rows
    .map(
      (r) => `
        <tr>
          <td style="padding:7px 0; font-family:${FONT}; font-size:13px; color:${BRAND.faint}; white-space:nowrap;">${esc(r.label)}</td>
          <td style="padding:7px 0 7px 16px; font-family:${FONT}; font-size:14px; font-weight:600; color:${BRAND.text}; text-align:right;">${esc(r.value)}</td>
        </tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 0 0; border-top:1px solid ${BRAND.border}; border-bottom:1px solid ${BRAND.border};">${cells}</table>`;
}

export type EmailContent = {
  preheader?: string;
  eyebrow?: string;
  heading: string;
  bodyHtml: string;
  cta?: { label: string; url: string };
  afterCta?: string;
  footerNote?: string;
};

export function renderEmail(c: EmailContent): string {
  const { preheader, eyebrow, heading, bodyHtml, cta, afterCta, footerNote } = c;

  const ctaBlock = cta
    ? `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:30px 0 0 0;">
                <tr>
                  <td align="center" style="border-radius:999px; background-color:${BRAND.lime};">
                    <a href="${cta.url}" target="_blank" style="display:inline-block; padding:15px 34px; font-family:${FONT}; font-size:15px; font-weight:700; letter-spacing:-0.01em; color:${BRAND.limeDark}; text-decoration:none; border-radius:999px;">${esc(cta.label)}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:20px 0 0 0; font-family:${FONT}; font-size:13px; line-height:1.6; color:${BRAND.faint};">Or paste this link into your browser:</p>
              <p style="margin:6px 0 0 0; font-family:${FONT}; font-size:13px; line-height:1.6; word-break:break-all;"><a href="${cta.url}" target="_blank" style="color:${BRAND.lime}; text-decoration:none;">${cta.url}</a></p>`
    : "";

  const afterCtaBlock = afterCta
    ? `<p style="margin:24px 0 0 0; font-family:${FONT}; font-size:13px; line-height:1.6; color:${BRAND.faint};">${esc(afterCta)}</p>`
    : "";

  const eyebrowBlock = eyebrow
    ? `<p style="margin:22px 0 0 0; font-family:${FONT}; font-size:11px; font-weight:600; letter-spacing:0.14em; text-transform:uppercase; color:${BRAND.lime};">${esc(eyebrow)}</p>`
    : "";

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="dark light" />
  <title>${esc(heading)}</title>
  <!--[if mso]><style>* { font-family: Arial, sans-serif !important; }</style><![endif]-->
</head>
<body style="margin:0; padding:0; background-color:${BRAND.bg}; -webkit-font-smoothing:antialiased;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:${BRAND.bg}; font-size:1px; line-height:1px;">${esc(preheader ?? heading)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BRAND.bg};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px;">

          <!-- Wordmark -->
          <tr>
            <td style="padding:8px 8px 28px 8px;">
              <span style="font-family:${FONT}; font-size:20px; font-weight:700; letter-spacing:-0.02em; color:${BRAND.text};">dineri<span style="color:${BRAND.text};">.app</span></span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:${BRAND.surface}; border:1px solid ${BRAND.border}; border-radius:20px; padding:44px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="width:44px; height:4px; background-color:${BRAND.text}; border-radius:999px; font-size:0; line-height:0;">&nbsp;</td></tr>
              </table>
              ${eyebrowBlock}
              <h1 style="margin:12px 0 0 0; font-family:${FONT}; font-size:24px; line-height:1.3; font-weight:700; letter-spacing:-0.02em; color:${BRAND.text};">${esc(heading)}</h1>
              <div style="margin:16px 0 0 0;">${bodyHtml}</div>
              ${ctaBlock}
              ${afterCtaBlock}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 8px 8px 8px;">
              <p style="margin:0 0 16px 0;">${socialRow()}</p>
              ${footerNote ? `<p style="margin:0; font-family:${FONT}; font-size:12px; line-height:1.6; color:${BRAND.faint};">${esc(footerNote)}</p>` : ""}
              <p style="margin:14px 0 0 0; font-family:${FONT}; font-size:12px; color:${BRAND.faint};">© ${new Date().getFullYear()} Dineri · The quiet infrastructure behind full tables.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
