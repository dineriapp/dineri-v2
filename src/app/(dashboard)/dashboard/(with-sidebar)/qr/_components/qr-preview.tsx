"use client";
import { QRCodeSchemaType } from "@/lib/validators/zod/qr-code.schema";
import QRCode from "qrcode";
import { useMemo } from "react";

export const QRPreview = ({ qr, size = 128 }: { qr: QRCodeSchemaType; size?: number }) => {
    const matrix = useMemo<number[][] | null>(() => {
        const target = qr.targetUrl?.trim() || " ";
        try {
            const code = QRCode.create(target, { errorCorrectionLevel: "M" });
            const mod = code.modules;
            const N = mod.size;
            const grid: number[][] = [];
            for (let y = 0; y < N; y++) {
                const row: number[] = [];
                for (let x = 0; x < N; x++) row.push(mod.get(x, y) ? 1 : 0);
                grid.push(row);
            }
            return grid;
        } catch {
            return null;
        }
    }, [qr.targetUrl]);

    if (!matrix) {
        return (
            <div
                className="flex items-center justify-center rounded-md text-[10px] text-muted-foreground"
                style={{ width: size, height: size, background: qr.backgroundColor }}
            >
                …
            </div>
        );
    }

    const N = matrix.length;
    const margin = 2;
    const total = N + margin * 2;

    return (
        <svg
            viewBox={`0 0 ${total} ${total}`}
            width={size}
            height={size}
            shapeRendering={qr.shape === "dots" ? "auto" : "crispEdges"}
            className="rounded-md"
        >
            <rect width={total} height={total} fill={qr.backgroundColor} />
            {matrix.map((row, y) =>
                row.map((on, x) => {
                    if (!on) return null;
                    if (qr.shape === "dots") {
                        return (
                            <circle
                                key={`${x}-${y}`}
                                cx={margin + x + 0.5}
                                cy={margin + y + 0.5}
                                r={0.42}
                                fill={qr.foregroundColor}
                            />
                        );
                    }
                    return (
                        <rect
                            key={`${x}-${y}`}
                            x={margin + x}
                            y={margin + y}
                            width={1}
                            height={1}
                            fill={qr.foregroundColor}
                        />
                    );
                }),
            )}
        </svg>
    );
};