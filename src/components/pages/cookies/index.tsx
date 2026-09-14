import { LegalSection } from "@/components/shared/legal-section";
import { LegalShell } from "@/components/shared/legal-shell";

const CookiesPage = () => {
  return (
    <LegalShell
      title="Cookies Policy"
      description="How Dineri uses cookies and similar technologies."
      number="L03"
      label="Legal · Cookies"
      headline={[{ plain: "Cookies " }, { lime: "Policy." }]}
      intro="This Cookies Policy explains which cookies we set when you visit dineri.app, what each one does, and how long it lasts. We use a small number of cookies that are strictly necessary to run the service and to remember your preferences. We do not use cookies for advertising, and we do not sell or share cookie data with advertising networks."
      lastUpdated="September 7th, 2026"
    >
      <LegalSection num="01" title="What Are Cookies?">
        <p>
          Cookies are small text files that are stored on your device or computer when you visit a
          website. Cookies allow the website to recognize your device and remember certain
          information about your preferences or actions over time.
        </p>
        <p>
          Cookies can be either session cookies (which are deleted when you close your browser) or
          persistent cookies (which remain on your device for a specified period or until manually
          deleted).
        </p>
      </LegalSection>

      <LegalSection num="02" title="How We Use Cookies">
        <p>We use cookies for the following purposes only:</p>
        <ul className="list-disc space-y-1.5 pl-5 marker:text-lime">
          <li>To keep you signed in to your Dineri account</li>
          <li>To remember your language preference</li>
          <li>To remember interface choices, such as whether the dashboard sidebar is open</li>
        </ul>
        <p>
          We do not use cookies for advertising, profiling or cross-site tracking. Visitor
          statistics for venue pages are counted on our servers and are not tied to an advertising
          identifier.
        </p>
      </LegalSection>

      <LegalSection num="03" title="Types of Cookies We Use">
        <p>These are the cookies Dineri sets. We set no others.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              name: "Essential · session",
              desc: "Keeps you signed in to your Dineri account and protects your session. Strictly necessary, so it cannot be switched off. Removed when you sign out or the session expires.",
            },
            {
              name: "Functionality · locale",
              desc: "Remembers the language you selected so your next visit loads in the same language.",
            },
            {
              name: "Functionality · sidebar_state",
              desc: "Remembers whether the dashboard sidebar is expanded or collapsed. Applies to merchant accounts only and expires after 7 days.",
            },
            {
              name: "No advertising cookies",
              desc: "We set no advertising, profiling or cross-site tracking cookies, and we run no third-party ad or analytics pixels on this website.",
            },
          ].map((c) => (
            <div key={c.name} className="rounded-xl border border-white/5 bg-surface-2 p-4">
              <div className="font-jetbrains-mono text-[10px] uppercase tracking-[0.18em] text-lime">
                {c.name}
              </div>
              <p className="mt-2 text-sm text-foreground/80">{c.desc}</p>
            </div>
          ))}
        </div>
      </LegalSection>

      <LegalSection num="04" title="Managing Cookies">
        <p>
          You can control and manage cookies in your browser settings. Most browsers allow you to
          reject or delete cookies, or notify you when a cookie is set. Please note that disabling
          cookies may affect the functionality of some website features.
        </p>
        <p>
          For more information on how to control cookies in your browser, visit{" "}
          <a
            href="https://www.allaboutcookies.org/"
            className="text-lime hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            allaboutcookies.org
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection num="05" title="Changes to the Cookies Policy">
        <p>
          We may update this Cookies Policy to reflect changes in our practices or for other
          operational, legal, or regulatory reasons. Any changes will be posted on this page, and
          the &quot;Last updated&quot; date will be revised accordingly.
        </p>
      </LegalSection>

      <LegalSection num="06" title="Contact Us">
        <p>If you have any questions or concerns about our cookies policy, please contact us at:</p>
        <p>
          <a href="mailto:info@dineri.app" className="text-lime hover:underline">
            info@dineri.app
          </a>
        </p>
      </LegalSection>
    </LegalShell>
  );
};

export default CookiesPage;
