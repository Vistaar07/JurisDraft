"use client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

export default function NavLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();

  // Calculate active state using useMemo to avoid hydration issues
  const isActive = useMemo(() => {
    // During SSR, pathname will be null, so return false
    if (typeof window === "undefined") return false;
    return pathname === href || (href !== "/" && pathname?.startsWith(href));
  }, [pathname, href]);

  return (
    <Link
      href={href}
      className={cn(
        "transition-colors text-sm duration-200 text-gray-600 hover:text-rose-500",
        className,
        isActive && "text-rose-500"
      )}
      suppressHydrationWarning
    >
      {children}
    </Link>
  );
}
