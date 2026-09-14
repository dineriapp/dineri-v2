"use client";
import { PlanLimitBanner } from "@/components/shared/plan-limit-banner";
import { Tip } from "@/components/ui/tip";
import { useAuth } from "@/lib/auth/hooks/use-auth";
import { canAddClient, getResourceLimitClient } from "@/lib/stripe/client";
import {
  Copy as CopyIcon,
  Download,
  Eye,
  Link as LinkIcon,
  Pencil,
  Plus,
  QrCode,
  Scan,
  Trash2,
} from "lucide-react";
import QRCode from "qrcode";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { SectionHeader, StatCard } from "../../_components";
import TopBar from "../../_components/top-bar";
import { useDeleteQRCode, useRestaurantQRCodes } from "@/lib/tanstack-react-query/hooks/qr-code";
import Loader from "@/components/ui/loader";
import { QRCodeType } from "@/drizzle/types";
import QrDialog from "./_components/qr-dialog";
import { QRPreview } from "./_components/qr-preview";

const safeFile = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-|-$/g, "") || "qr";

const Page = () => {
  const { user } = useAuth();
  const { data: qrCodes = [], isPending } = useRestaurantQRCodes();
  const [open, setOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<QRCodeType | null>(null);
  const deleteMutation = useDeleteQRCode();
  const plan = user?.subscription?.plan ?? "starter";
  const canAddMore = canAddClient(plan, "qrCodes", qrCodes.length);

  const totals = useMemo(
    () => ({
      total: qrCodes.length,
      scans: qrCodes.reduce((s, i) => s + i.scans, 0),
      best: [...qrCodes].sort((a, b) => b.scans - a.scans)[0]?.label ?? "-",
    }),
    [qrCodes],
  );

  const downloadQR = async (q: QRCodeType, format: "svg" | "png") => {
    try {
      if (format === "svg") {
        const svg = await QRCode.toString(
          `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/api/qr/scan/${q.id}` || " ",
          {
            type: "svg",
            color: { dark: q.foregroundColor, light: q.backgroundColor },
            margin: 2,
            errorCorrectionLevel: "M",
            width: 512,
          },
        );
        const blob = new Blob([svg], { type: "image/svg+xml" });
        triggerDownload(blob, `${safeFile(q.label)}.svg`);
      } else {
        const dataUrl = await QRCode.toDataURL(
          `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/api/qr/scan/${q.id}` || " ",
          {
            color: { dark: q.foregroundColor, light: q.backgroundColor },
            margin: 2,
            errorCorrectionLevel: "M",
            width: 512,
          },
        );
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `${safeFile(q.label)}.png`;
        a.click();
      }
      toast("Download started", { description: `${q.label}.${format}` });
    } catch {
      toast("Download failed", { description: "Could not generate QR code." });
    }
  };

  if (isPending) {
    return <Loader className="min-h-75" />;
  }

  return (
    <>
      <TopBar page="QR Codes" />

      <div className="p-4 sm:p-6">
        <div className="space-y-4 animate-fade-in sm:space-y-6">
          <SectionHeader
            iconClassName="text-white"
            icon={QrCode}
            title="QR Codes"
            description="Generate branded QR codes for table tents, menus, receipts and posters. Track scans for each placement."
            badge="Pro"
            actions={
              <button
                onClick={() => {
                  if (canAddMore) {
                    setEditingRow(null);
                    setOpen(true);
                  } else {
                    toast.error(
                      `Your ${plan} plan allows up to ${getResourceLimitClient(plan, "qrCodes")} QR codes. Please upgrade to add more.`,
                    );
                  }
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-semibold text-background hover:bg-white/90"
              >
                <Plus className="h-3.5 w-3.5" /> New QR
              </button>
            }
          />

          <PlanLimitBanner resource="qrCodes" currentCount={qrCodes.length} warningThreshold={2} />

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3">
            <StatCard label="QR codes" value={totals.total} icon={QrCode} />
            <StatCard
              label="Total scans"
              value={totals.scans.toLocaleString()}
              icon={Scan}
              tone="white"
            />
            <StatCard label="Top placement" value={totals.best} icon={Eye} tone="amber" />
          </div>

          {qrCodes.length === 0 ? (
            <div className="dash-card rounded-2xl border border-dashed border-white/10 bg-surface-1 px-4 py-10 text-center sm:p-12">
              <QrCode className="mx-auto h-6 w-6 text-muted-foreground" />
              <h3 className="font-inter-tight mt-3 text-base font-semibold">No QR codes yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Create one for your tables, receipts or window stickers.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
              {qrCodes.map((q) => (
                <Card
                  key={q.id}
                  qr={q}
                  onEdit={() => {
                    setEditingRow(q);
                    setOpen(true);
                  }}
                  onDelete={() => {
                    deleteMutation.mutate(q.id);
                  }}
                  onCopy={() => {
                    navigator.clipboard?.writeText(q.targetUrl);
                    toast("URL copied");
                  }}
                  onDownload={(format) => downloadQR(q, format)}
                />
              ))}
            </div>
          )}

          <div className="dash-card rounded-2xl border border-white/5 bg-surface-1 p-3 sm:p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white">
                <LinkIcon className="h-4 w-4 shrink-0" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold">Tip - use trackable URLs</div>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  Point each QR code to a different short URL so you can see which placement drives
                  the most scans.
                </p>
              </div>
            </div>
          </div>

          <QrDialog open={open} setOpen={setOpen} editingRow={editingRow ?? undefined} />
        </div>
      </div>
    </>
  );
};

export default Page;

function triggerDownload(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

const Card = ({
  qr,
  onEdit,
  onDelete,
  onCopy,
  onDownload,
}: {
  qr: QRCodeType;
  onEdit: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onDownload: (format: "svg" | "png") => void;
}) => (
  <div className="dash-card group rounded-2xl border border-white/5 bg-surface-1 p-3 transition hover:border-white/15 sm:p-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
      <div className="w-fit shrink-0 rounded-xl border border-white/10 p-2">
        <QRPreview
          qr={{
            ...qr,
            targetUrl: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/api/qr/scan/${qr.id}`,
          }}
          size={112}
        />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="font-inter-tight text-base font-semibold leading-tight">{qr.label}</h4>
        <Tip label={qr.targetUrl} contentClassName="max-w-sm break-all">
          <p className="mt-1 truncate text-[12px] text-muted-foreground">{qr.targetUrl}</p>
        </Tip>

        <Tip label="Total times this code has been scanned">
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-background px-2 py-1 text-[11px] text-muted-foreground">
            <Scan className="h-3 w-3" />
            <span className="tabular-nums">{qr.scans.toLocaleString()}</span> scans
          </div>
        </Tip>

        <div className="mt-3 flex flex-wrap items-center gap-1">
          <Tip label="Download as PNG - best for print">
            <button
              onClick={() => onDownload("png")}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-white/10 bg-background px-2 text-[11px] text-foreground/80 hover:border-white/20 sm:h-7"
            >
              <Download className="h-3 w-3" /> PNG
            </button>
          </Tip>
          <Tip label="Download as SVG - scales to any size">
            <button
              onClick={() => onDownload("svg")}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-white/10 bg-background px-2 text-[11px] text-foreground/80 hover:border-white/20 sm:h-7"
            >
              <Download className="h-3 w-3" /> SVG
            </button>
          </Tip>
          <Tip label="Copy the destination URL">
            <button
              onClick={onCopy}
              className="rounded-md p-2 text-muted-foreground hover:bg-white/5 hover:text-foreground sm:p-1.5"
              aria-label="Copy URL"
            >
              <CopyIcon className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            </button>
          </Tip>
          <Tip label="Edit QR code">
            <button
              onClick={onEdit}
              className="rounded-md p-2 text-muted-foreground hover:bg-white/5 hover:text-foreground sm:p-1.5"
              aria-label="Edit"
            >
              <Pencil className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            </button>
          </Tip>
          <Tip label="Delete QR code">
            <button
              onClick={onDelete}
              className="rounded-md p-2 text-muted-foreground hover:bg-danger/10 hover:text-danger sm:p-1.5"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            </button>
          </Tip>
        </div>
      </div>
    </div>
  </div>
);
