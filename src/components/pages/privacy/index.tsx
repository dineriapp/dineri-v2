import { LegalSection } from "@/components/shared/legal-section";
import { LegalShell } from "@/components/shared/legal-shell";
import React from "react";

const PrivacyPage = () => {
  return (
    <LegalShell
      title="Privacy Policy"
      description="How Dineri collects, uses, and protects your personal data under GDPR."
      number="L02"
      label="Legal · Privacy"
      headline={[{ plain: "Privacy " }, { lime: "Policy." }]}
      intro="This policy explains what personal data Dineri collects, why we collect it, who we share it with, and the rights you have over it under the GDPR. It covers both the merchants who run a venue on Dineri and the guests who visit a venue page to view a menu, place an order or book a table."
      lastUpdated="September 7th, 2026"
    >
      <LegalSection num="01" title="Introduction">
        <p>
          In the following, we provide information about the collection of personal data when using:
        </p>
        <ul className="list-disc space-y-1.5 pl-5 marker:text-lime">
          <li>
            our website{" "}
            <a href="https://dineri.app" className="text-lime hover:underline">
              dineri.app
            </a>
          </li>
          <li>our profiles in social media</li>
        </ul>
        <p>
          Personal data is any data that can be related to a specific natural person, such as their
          name or IP address.
        </p>
      </LegalSection>

      <LegalSection num="02" title="Contact Details">
        <p>
          The controller within the meaning of Art. 4 para. 7 EU General Data Protection Regulation
          (GDPR) is Dineri. You may reach us at{" "}
          <a href="mailto:info@dineri.app" className="text-lime hover:underline">
            info@dineri.app
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection num="03" title="Data Collection and Processing">
        <p>
          We collect and process personal data only to the extent necessary for providing our
          services and improving user experience. This includes:
        </p>
        <p className="font-medium text-foreground">If you run a venue on Dineri:</p>
        <ul className="list-disc space-y-1.5 pl-5 marker:text-lime">
          <li>Account details - your name, email address and password</li>
          <li>Venue details you publish - address, opening hours, menu, photos and links</li>
          <li>Billing records held with our payment provider for your subscription</li>
          <li>Technical information such as your browser, device and IP address</li>
        </ul>
        <p className="font-medium text-foreground">If you are a guest visiting a venue page:</p>
        <ul className="list-disc space-y-1.5 pl-5 marker:text-lime">
          <li>
            Details you enter to make a booking or place an order - typically a name, email address,
            phone number and any note you add, such as an allergy
          </li>
          <li>Payment details, which are handled by Stripe and never reach our servers</li>
          <li>
            Aggregated page statistics, such as how many people viewed a menu or scanned a QR code
          </li>
        </ul>
        <p>
          We do not ask for special category data. Please avoid entering health information in a
          booking note beyond what a venue needs to serve you safely.
        </p>
      </LegalSection>

      <LegalSection num="04" title="Data Sharing and Third Parties">
        <p>
          We do not sell or trade your personal data, and we do not share it for advertising. We do
          rely on a small number of service providers who process data on our behalf, under contract
          and only on our instructions:
        </p>
        <ul className="list-disc space-y-1.5 pl-5 marker:text-lime">
          <li>
            <strong>Stripe</strong> - payment processing for subscriptions, deposits and online
            orders. Card details are handled by Stripe and never reach our servers.
          </li>
          <li>
            <strong>Amazon Web Services (S3)</strong> - storage of images and files uploaded to a
            venue page.
          </li>
          <li>
            <strong>Google</strong> - sign-in with Google, and address lookup when a venue enters
            its location.
          </li>
          <li>
            <strong>Our database and cache providers</strong> - hosting of account, menu, booking
            and order records, and short-lived counters used for visitor statistics and rate
            limiting.
          </li>
          <li>
            <strong>Our email provider</strong> - delivery of account emails and booking or order
            confirmations.
          </li>
        </ul>
        <p>
          Where a venue connects its own Stripe account, payments for that venue are made directly
          to the venue and Stripe acts for them as well as for us.
        </p>
        <p>
          For guest data collected through a venue page - a booking name, contact details or an
          order - the venue is the controller and Dineri acts as its processor. A Data Processing
          Agreement is available to every merchant on request.
        </p>
      </LegalSection>

      <LegalSection num="05" title="Your Rights">
        <p>Under GDPR, you have the following rights regarding your personal data:</p>
        <ul className="list-disc space-y-1.5 pl-5 marker:text-lime">
          <li>Right to access your personal data</li>
          <li>Right to rectification of inaccurate data</li>
          <li>Right to erasure (&quot;right to be forgotten&quot;)</li>
          <li>Right to restrict processing</li>
          <li>Right to data portability</li>
          <li>Right to object to processing</li>
        </ul>
      </LegalSection>

      <LegalSection num="06" title="Data Security">
        <p>
          We take the security of your personal data seriously. We have implemented technical and
          organizational measures to protect your personal data from unauthorized access, loss,
          misuse, or alteration.
        </p>
        <p>
          Despite these efforts, no security measures are completely foolproof. Therefore, we cannot
          guarantee the absolute security of your data.
        </p>
      </LegalSection>

      <LegalSection num="07" title="Cookies and Tracking Technologies">
        <p>
          We set a small number of cookies: one to keep you signed in, one to remember your
          language, and one to remember whether the dashboard sidebar is open. We do not use
          advertising, profiling or cross-site tracking cookies, and we run no third-party
          advertising or analytics pixels on this website.
        </p>
        <p>
          Visitor statistics for venue pages are counted on our servers rather than in your browser.
          Each is a short-lived, aggregated count and is not used to build a profile of you. Full
          details of every cookie we set are in our{" "}
          <a href="/cookies" className="text-lime hover:underline">
            Cookies Policy
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection num="08" title="Data Retention">
        <p>
          We retain your personal data only for as long as necessary to fulfill the purposes for
          which it was collected or as required by law. When your data is no longer needed, we will
          securely delete or anonymize it.
        </p>
      </LegalSection>

      <LegalSection num="09" title="International Data Transfers">
        <p>
          Your personal data may be transferred to, and processed in, a country outside of the
          European Economic Area (EEA). We will ensure that any such transfers are in compliance
          with applicable data protection laws, and appropriate safeguards will be in place to
          protect your data.
        </p>
      </LegalSection>

      <LegalSection num="10" title="Updates to the Privacy Policy">
        <p>
          We may update this Privacy Policy from time to time to reflect changes in our practices or
          legal requirements. When we make changes, we will update the &quot;Last updated&quot; date
          at the top of this page.
        </p>
        <p>
          Please review this Privacy Policy periodically to stay informed about how we are
          protecting your data.
        </p>
      </LegalSection>

      <LegalSection num="11" title="Contact Us">
        <p>
          If you have any questions about this Privacy Policy or wish to exercise any of your rights
          regarding your personal data, please contact us at:
        </p>
        <p>
          <a href="mailto:info@dineri.app" className="text-lime hover:underline">
            info@dineri.app
          </a>
        </p>
      </LegalSection>
    </LegalShell>
  );
};

export default PrivacyPage;
