"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function PaymentSuccessHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if we're returning from a successful payment
    const success = searchParams.get("success");
    const planParam = searchParams.get("plan"); // Get plan from URL if available

    if (success === "true") {
      const plan = planParam || "Pro";

      // Immediately update localStorage and trigger event
      const event = new CustomEvent("planUpdated", {
        detail: { plan },
      });
      window.dispatchEvent(event);

      // Also update via API as a fallback (in case webhook didn't fire)
      fetch("/api/user/plan/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan }),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("Plan update API response:", data);

          // Trigger another update event after API confirms
          const confirmEvent = new CustomEvent("planUpdated", {
            detail: { plan },
          });
          window.dispatchEvent(confirmEvent);
        })
        .catch((err) => {
          console.error("Failed to update plan via API:", err);
        });

      // Show success message
      setTimeout(() => {
        toast.success("Payment successful! Your subscription is now active.", {
          duration: 5000,
        });
      }, 500);

      // Clean up the URL
      window.history.replaceState({}, "", "/");
    }
  }, [searchParams]);

  return null;
}
