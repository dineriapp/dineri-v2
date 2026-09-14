import { detailRows, esc, renderEmail, textToHtml } from "./layout";

const FONT = "'Helvetica Neue',Arial,sans-serif";
const MUTED = "#9a9a9a";

const para = (text: string) =>
  `<p style="margin:0; font-family:${FONT}; font-size:15px; line-height:1.65; color:${MUTED};">${esc(text)}</p>`;

const paraMt = (text: string) =>
  `<p style="margin:16px 0 0 0; font-family:${FONT}; font-size:15px; line-height:1.65; color:${MUTED};">${esc(text)}</p>`;

const PLATFORM_FOOTER =
  "You're receiving this because you submitted a form on dineri.app. If this wasn't you, you can safely ignore this message.";

type Built = { subject: string; html: string };

// Demo request                                                        
export type DemoRequestData = {
  business: string;
  contact: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  notes?: string;
};

export function demoRequestConfirmation(d: DemoRequestData): Built {
  return {
    subject: "We've received your demo request - Dineri",
    html: renderEmail({
      preheader: "Thanks for requesting a Dineri demo. Our team will be in touch shortly.",
      eyebrow: "Demo request",
      heading: "Thanks - we've got your request",
      bodyHtml:
        para(`Dear ${d.contact}, thank you for requesting a demo of Dineri for ${d.business}.`) +
        paraMt(
          "A product specialist will be in touch shortly to arrange a personalised walkthrough. If you have any questions in the meantime, simply reply to this email.",
        ) +
        paraMt("Warm regards,") +
        `<p style="margin:2px 0 0 0; font-family:${FONT}; font-size:15px; line-height:1.65; color:${MUTED};">The Dineri Team</p>`,
      footerNote: PLATFORM_FOOTER,
    }),
  };
}

// Support ticket                                                    

export type SupportTicketData = {
  fullName: string;
  email: string;
  subject: string;
  message: string;
};

export function supportTicketConfirmation(d: SupportTicketData): Built {
  return {
    subject: "We've received your support request - Dineri",
    html: renderEmail({
      preheader: "Your request has been received and logged. Our team will be in touch shortly.",
      eyebrow: "Dineri Support",
      heading: "We've received your request",
      bodyHtml:
        para(`Dear ${d.fullName}, thank you for contacting Dineri Support.`) +
        paraMt(
          "Your request has been received and a member of our team will respond within one business day. To add anything further, simply reply to this email.",
        ) +
        paraMt("Kind regards,") +
        `<p style="margin:2px 0 0 0; font-family:${FONT}; font-size:15px; line-height:1.65; color:${MUTED};">The Dineri Support Team</p>`,
      footerNote: PLATFORM_FOOTER,
    }),
  };
}

// Job application            

export type JobApplicationData = {
  role: string;
  fullName: string;
  email: string;
  phone: string;
  experience: string;
  education?: string;
  notice?: string;
  salary?: string;
  city?: string;
  state?: string;
  portfolio?: string;
  linkedin?: string;
  github?: string;
  cover: string;
};

export function jobApplicationConfirmation(d: JobApplicationData): Built {
  return {
    subject: `Your application for ${d.role} - Dineri`,
    html: renderEmail({
      preheader: `Thanks for applying to the ${d.role} role at Dineri.`,
      eyebrow: "Careers",
      heading: "Thanks for applying",
      bodyHtml:
        para(`Dear ${d.fullName}, thank you for applying for the ${d.role} role at Dineri.`) +
        paraMt(
          "We've received your application and our talent team will review it carefully. We'll be in touch about the next steps.",
        ) +
        paraMt("Kind regards,") +
        `<p style="margin:2px 0 0 0; font-family:${FONT}; font-size:15px; line-height:1.65; color:${MUTED};">The Dineri Talent Team</p>`,
      footerNote: PLATFORM_FOOTER,
    }),
  };
}

// Internal team notification     

export function internalNotification(
  kind: string,
  heading: string,
  rows: { label: string; value: string }[],
  longText?: { label: string; value: string },
): Built {
  return {
    subject: `[${kind}] ${heading}`,
    html: renderEmail({
      preheader: heading,
      eyebrow: kind,
      heading,
      bodyHtml:
        detailRows(rows.filter((r) => r.value)) +
        (longText?.value
          ? `<p style="margin:20px 0 6px 0; font-family:${FONT}; font-size:12px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; color:#5f5f5f;">${esc(longText.label)}</p>${textToHtml(longText.value)}`
          : ""),
      footerNote: "Automated internal notification from dineri.app.",
    }),
  };
}
