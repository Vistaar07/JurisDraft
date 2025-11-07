"use client";

import { Scale } from "lucide-react";
import NavLink from "./nav-link";
import { SignedIn, SignedOut, UserButton, useAuth } from "@clerk/nextjs";
import PlanBadge from "./plan-badge";
import { useState, useEffect } from "react";

export default function Navbar() {
  const { isLoaded, isSignedIn } = useAuth();
  const [userPlan, setUserPlan] = useState<string>("Free");

  useEffect(() => {
    const fetchUserPlan = async () => {
      if (!isLoaded || !isSignedIn) {
        setUserPlan("Free");
        return;
      }

      try {
        const response = await fetch("/api/user/plan", {
          cache: "no-store",
        });
        if (response.ok) {
          const data = await response.json();
          setUserPlan(data.plan || "Free");
        }
      } catch (error) {
        console.error("Error fetching user plan:", error);
      }
    };

    fetchUserPlan();
  }, [isLoaded, isSignedIn]);

  // Check if user has a paid plan
  const hasPaidPlan = userPlan === "Basic" || userPlan === "Pro";

  return (
    <nav className="container flex items-center justify-between py-4 lg:px-8 px-2 mx-auto">
      <div className="flex lg:flex-1">
        <NavLink href="/" className="flex items-center gap-1 lg:gap-2 shrink-0">
          <Scale className="w-5 h-5 lg:w-8 lg:h-8 text-gray-900 hover:rotate-12 transform transition duration-200 ease-in-out" />
          <span className="font-extrabold lg:text-xl text-gray-900">
            JurisDraft
          </span>
        </NavLink>
      </div>

      <div className="flex lg:justify-center gap-4 lg:gap-12 lg:items-center">
        {!hasPaidPlan && <NavLink href="/#pricing">Pricing</NavLink>}
        {isLoaded && (
          <SignedIn>
            <NavLink href="/dashboard">Dashboard</NavLink>
            <NavLink href="/legal-chat">Legal Chat</NavLink>
          </SignedIn>
        )}
      </div>

      <div className="flex lg:justify-end lg:flex-1">
        {isLoaded ? (
          <>
            <SignedIn>
              <div className="flex gap-2 items-center">
                <NavLink href="/upload">Compliance Analysis</NavLink>
                <PlanBadge />
                <UserButton />
              </div>
            </SignedIn>
            <SignedOut>
              <NavLink href="/sign-in">Sign In</NavLink>
            </SignedOut>
          </>
        ) : (
          <div className="h-10 w-20" />
        )}
      </div>
    </nav>
  );
}
