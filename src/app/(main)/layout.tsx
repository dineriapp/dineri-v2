"use client";

import { usePathname } from "next/navigation";

/**
 * Wraps every public marketing page in a minimal fade-in. Keying on the
 * pathname re-mounts the wrapper on navigation, so each page fades in fresh.
 */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="animate-page-in motion-reduce:animate-none">
      {children}
    </div>
  );
}
