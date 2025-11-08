"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import PlanRequired from "@/components/common/plan-required";
import { hasActivePlan } from "@/utils/plan-helpers";

type ProtectedFeatureProps = {
  children: React.ReactNode;
  featureName: string;
  featureDescription: string;
  icon?: React.ReactNode;
};

export default function ProtectedFeature({
  children,
  featureName,
  featureDescription,
  icon,
}: ProtectedFeatureProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserPlan = async () => {
      if (!isLoaded) {
        return;
      }

      if (!isSignedIn) {
        setUserPlan("Free");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/user/plan", {
          cache: "no-store",
        });
        if (response.ok) {
          const data = await response.json();
          setUserPlan(data.plan || "Free");
        } else {
          setUserPlan("Free");
        }
      } catch (error) {
        console.error("Error fetching user plan:", error);
        setUserPlan("Free");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserPlan();
  }, [isLoaded, isSignedIn]);

  // Show loading state
  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-rose-600 border-r-transparent mb-4"></div>
          <p className="text-gray-500 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Show placeholder if user doesn't have an active plan
  if (!hasActivePlan(userPlan)) {
    return (
      <PlanRequired
        featureName={featureName}
        featureDescription={featureDescription}
        icon={icon}
      />
    );
  }

  // User has an active plan, show the feature
  return <>{children}</>;
}
