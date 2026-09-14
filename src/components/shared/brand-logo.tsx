import Image from "next/image";

import { cn } from "@/lib/utils";

const LOGO_WIDTH = 3172;
const LOGO_HEIGHT = 762;

export function BrandLogo({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/images/logo.png"
      alt="Dineri"
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      sizes="160px"
      priority={priority}
      className={cn("w-auto object-contain", className)}
    />
  );
}
