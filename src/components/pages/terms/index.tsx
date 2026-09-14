import { LegalSection } from "@/components/shared/legal-section";
import { LegalShell } from "@/components/shared/legal-shell";

const TermsPage = () => {
  return (
    <>
      <LegalShell
        title="Terms of Service"
        description="The terms governing your access to and use of Dineri."
        number="L01"
        label="Legal · Terms"
        headline={[{ plain: "Terms of " }, { lime: "Service." }]}
        intro="These Terms govern your access to and use of our website and services. By accessing or using our services, you agree to comply with these Terms. If you do not agree, you may not access or use our services."
        lastUpdated="September 7th, 2026"
      >
        <LegalSection num="01" title="Acceptance of Terms">
          <p>
            By accessing or using our services, you agree to be bound by these Terms and our Privacy
            Policy. If you are using our services on behalf of an organization, you represent and
            warrant that you have the authority to bind that organization to these Terms.
          </p>
        </LegalSection>

        <LegalSection num="02" title="Use of the Services">
          <p>
            You agree to use our services only for lawful purposes and in accordance with these
            Terms. You are prohibited from using the services to:
          </p>
          <ul className="list-disc space-y-1.5 pl-5 marker:text-lime">
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe on the intellectual property rights of others</li>
            <li>Engage in any activity that could harm or disrupt the services</li>
            <li>Attempt to gain unauthorized access to any systems or networks</li>
          </ul>
        </LegalSection>

        <LegalSection num="03" title="Account Registration">
          <p>
            To access certain features of our services, you may be required to create an account.
            You are responsible for maintaining the confidentiality of your account credentials and
            for all activities that occur under your account.
          </p>
        </LegalSection>

        <LegalSection num="04" title="Plans, Billing and Cancellation">
          <p>
            Dineri is offered on a free Starter plan and on paid Growth and Scale plans. Paid plans
            are billed in advance, monthly or annually, through our payment provider Stripe. Prices
            and what each plan includes are set out on our pricing page.
          </p>
          <ul className="list-disc space-y-1.5 pl-5 marker:text-lime">
            <li>
              Your subscription renews automatically at the end of each billing period until you
              cancel it.
            </li>
            <li>
              You can cancel at any time from your billing settings. Your plan stays active until
              the end of the period you have already paid for.
            </li>
            <li>
              If a payment fails, we may downgrade or suspend access to paid features until it is
              resolved.
            </li>
            <li>
              We do not charge commission on the reservations or orders your venue takes through
              Dineri.
            </li>
          </ul>
          <p>
            Where you connect your own Stripe account to take deposits or online orders, those
            payments are made by your guests directly to you. You are responsible for fulfilling
            those bookings and orders, for any refunds you agree to, and for the terms you present
            to your own guests.
          </p>
        </LegalSection>

        <LegalSection num="05" title="Your Content and Your Guests' Data">
          <p>
            You keep ownership of the content you publish through Dineri - your menu, descriptions,
            images and venue details. You grant us the limited right to host and display that
            content so we can operate the service on your behalf.
          </p>
          <p>
            You are responsible for making sure the content you publish is accurate and lawful,
            including allergen and dietary information. For personal data your guests provide when
            booking or ordering, you act as the data controller and Dineri acts as your processor,
            as described in our Privacy Policy.
          </p>
        </LegalSection>

        <LegalSection num="06" title="Termination">
          <p>
            We reserve the right to suspend or terminate your access to the services at our
            discretion, without notice, for any violation of these Terms or for any other reason
            deemed necessary.
          </p>
        </LegalSection>

        <LegalSection num="07" title="Disclaimers and Limitation of Liability">
          <p>
            The services are provided &quot;as is&quot; without any warranties or guarantees of any
            kind, either express or implied. We do not guarantee that the services will be
            error-free, uninterrupted, or secure.
          </p>
          <p>
            To the fullest extent permitted by law, we shall not be liable for any direct, indirect,
            incidental, or consequential damages arising from your use of the services.
          </p>
        </LegalSection>

        <LegalSection num="08" title="Governing Law">
          <p>
            These Terms shall be governed by and construed in accordance with the laws of Italy,
            without regard to its conflict of law provisions. Any dispute arising out of or in
            connection with these Terms shall be resolved by the competent courts of Milan, Italy.
          </p>
          <p>
            If you are a consumer resident in the European Union, this choice of law does not
            deprive you of the protection afforded by the mandatory provisions of the law of your
            country of residence, and you may also bring proceedings in the courts of that country.
          </p>
        </LegalSection>

        <LegalSection num="09" title="Changes to the Terms">
          <p>
            We may update these Terms from time to time. When changes are made, we will update the
            &quot;Last updated&quot; date at the top of this page. Your continued use of the
            services after the changes take effect constitutes your acceptance of the revised Terms.
          </p>
        </LegalSection>

        <LegalSection num="10" title="Contact Us">
          <p>If you have any questions about these Terms, please contact us at:</p>
          <p>
            <a href="mailto:info@dineri.app" className="text-lime hover:underline">
              info@dineri.app
            </a>
          </p>
        </LegalSection>
      </LegalShell>
    </>
  );
};

export default TermsPage;
