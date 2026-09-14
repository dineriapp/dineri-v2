"use client";
import { ArrowUpRight, AtSign, FileText, Mail, Server, XCircle, Zap } from "lucide-react";
import EmailTemplatesSection from "./_components/email-templates";
import { SMTPSettings } from "./_components/smtp";
import { useAuth } from "@/lib/auth/hooks/use-auth";
import { getEmailMode } from "@/lib/stripe/checkers";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const Page = () => {
  const { user } = useAuth();
  const plan = user?.subscription.plan || "starter";
  const mode = getEmailMode(plan);

  if (mode === "disabled") {
    return (
      <section className="dash-card relative rounded-2xl border border-white/5 bg-surface-1 p-4 h-fit sm:p-6">
        <div className="flex flex-col items-start gap-3">
          {/* Header */}
          <div className="flex w-full items-start gap-3 border-b border-white/5 pb-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white">
              <AtSign className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-inter-tight text-xl font-semibold">Email Integration</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Email features are not included in your current plan.
              </p>
            </div>
          </div>

          {/* Plan comparison with template details */}
          <div className="w-full space-y-3">
            <h3 className="text-sm font-medium">What you get with each plan</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {/* Starter */}
              <div className="rounded-xl border border-white/10 bg-background p-4">
                <div className="mb-1 text-xs font-medium text-muted-foreground">Starter</div>
                <div className="flex items-center gap-2 text-sm">
                  <XCircle className="h-4 w-4 text-red-400" />
                  <span className="text-muted-foreground">No email</span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground/60">
                  - No templates available
                </div>
              </div>

              {/* Growth */}
              <div className="rounded-xl border border-white/10 bg-background p-4">
                <div className="mb-1 text-xs font-medium text-muted-foreground">Growth</div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-blue-400" />
                  <span className="text-foreground">Platform email</span>
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  Send via <span className="font-mono text-blue-300">contact@dineri.app</span>
                </div>
                <div className="mt-2 flex items-start gap-1.5 text-xs">
                  <FileText className="mt-0.5 h-3.5 w-3.5 text-white" />
                  <span className="text-foreground">
                    Editable templates: reservation, order, delivery, cancellation
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground/70">
                  Use custom placeholders like <span className="font-mono">customer_name</span>,{" "}
                  <span className="font-mono">reservation_date</span>…
                </div>
              </div>

              {/* Scale */}
              <div className="rounded-xl border border-white/10 bg-background p-4">
                <div className="mb-1 text-xs font-medium text-muted-foreground">Scale</div>
                <div className="flex items-center gap-2 text-sm">
                  <Server className="h-4 w-4 text-white" />
                  <span className="text-foreground">Custom SMTP</span>
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  Use your own email provider
                </div>
                <div className="mt-2 flex items-start gap-1.5 text-xs">
                  <FileText className="mt-0.5 h-3.5 w-3.5 text-white" />
                  <span className="text-foreground">
                    Editable templates: reservation, order, delivery, cancellation
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground/70">
                  Full control over from‑address and branding
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-background p-4">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-white" />
              <span className="text-sm">Upgrade to Growth or Scale to unlock email features.</span>
            </div>
            <Link href="/dashboard/settings/subscription">
              <Button className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-xl bg-white px-2.5 py-2 text-xs font-semibold text-background hover:bg-white/90 sm:px-3">
                <>
                  Upgrade plan
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                </>
              </Button>
            </Link>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section
      aria-labelledby="settings-panel-title"
      className="dash-card relative rounded-2xl border border-white/5 bg-surface-1 p-4 h-fit sm:p-6"
    >
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-white/5 pb-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white">
            <AtSign className="h-4 w-4" />
          </div>
          <div>
            <h2 id="settings-panel-title" className="font-inter-tight text-xl font-semibold">
              Email Integration
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">SMTP and outgoing mail</p>
          </div>
        </div>
      </header>
      <div>
        <div className="space-y-4">
          {/* SMTP block */}
          <SMTPSettings />
          {/* Templates block */}
          <EmailTemplatesSection />
        </div>
      </div>
    </section>
  );
};

export default Page;
