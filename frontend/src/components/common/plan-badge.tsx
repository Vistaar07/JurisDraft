"use client";

import { Badge } from "@/components/ui/badge";
import { Crown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const PLAN_STORAGE_KEY = "jurisdraft_user_plan";

export default function PlanBadge() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [plan, setPlan] = useState<string>("Free");
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const [refreshKey, setRefreshKey] = useState(0);

  // Handle client-side mounting to prevent hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load plan from localStorage on mount
  useEffect(() => {
    if (mounted && isSignedIn && user?.id) {
      const storageKey = `${PLAN_STORAGE_KEY}_${user.id}`;
      const cachedPlan = localStorage.getItem(storageKey);
      if (cachedPlan) {
        setPlan(cachedPlan);
      }
    } else if (mounted && !isSignedIn) {
      // Clear localStorage when user signs out
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(PLAN_STORAGE_KEY)) {
          localStorage.removeItem(key);
        }
      });
    }
  }, [mounted, isSignedIn, user?.id]);

  useEffect(() => {
    const fetchPlan = async () => {
      if (!isSignedIn || !user?.id) {
        setPlan("Free");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/user/plan", {
          cache: "no-store", // Ensure we always get fresh data
        });
        if (response.ok) {
          const data = await response.json();
          const fetchedPlan = data.plan || "Free";
          setPlan(fetchedPlan);

          // Save to localStorage
          const storageKey = `${PLAN_STORAGE_KEY}_${user.id}`;
          localStorage.setItem(storageKey, fetchedPlan);
        }
      } catch (error) {
        console.error("Error fetching plan:", error);
        // Don't override cached plan on error
      } finally {
        setLoading(false);
      }
    };

    if (mounted) {
      fetchPlan();
    }
  }, [isSignedIn, searchParams, refreshKey, mounted, user?.id]);

  // Listen for plan update events
  useEffect(() => {
    const handlePlanUpdate = (event?: CustomEvent<{ plan: string }>) => {

      // If event has plan data, update immediately
      if (event?.detail?.plan && user?.id) {
        const newPlan = event.detail.plan;
        setPlan(newPlan);
        const storageKey = `${PLAN_STORAGE_KEY}_${user.id}`;
        localStorage.setItem(storageKey, newPlan);
      }

      // Also trigger a refresh
      setRefreshKey((prev) => prev + 1);
    };

    window.addEventListener("planUpdated", handlePlanUpdate as EventListener);
    return () =>
      window.removeEventListener(
        "planUpdated",
        handlePlanUpdate as EventListener
      );
  }, [user?.id]);

  // Don't render anything until mounted on client to prevent hydration mismatch
  // Also don't render if user is not signed in or has Free plan
  if (!mounted || loading || !isSignedIn || plan === "Free") {
    return null;
  }

  // Different badge styles based on plan
  const getBadgeStyle = () => {
    switch (plan) {
      case "Pro":
        return {
          className: "from-amber-100 to-amber-200 border-amber-300",
          icon: <Crown className="w-3 h-3 mr-1 text-amber-600" />,
          text: "Pro Plan",
        };
      case "Basic":
        return {
          className: "from-blue-100 to-blue-200 border-blue-300",
          icon: <Sparkles className="w-3 h-3 mr-1 text-blue-600" />,
          text: "Basic Plan",
        };
      default:
        return null; // Should never reach here since we return null above for Free plan
    }
  };

  const badgeStyle = getBadgeStyle();

  // Don't render if no badge style (safety check)
  if (!badgeStyle) {
    return null;
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "ml-2 bg-linear-to-r hidden lg:flex flex-row items-center",
        badgeStyle.className
      )}
    >
      {badgeStyle.icon} {badgeStyle.text}
    </Badge>
  );
}
