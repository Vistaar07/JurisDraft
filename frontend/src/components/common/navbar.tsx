"use client";

import {
  Scale,
  Menu,
  X,
  ChevronDown,
  FileText,
  MessageSquare,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import NavLink from "./nav-link";
import { SignedIn, SignedOut, UserButton, useAuth } from "@clerk/nextjs";
import PlanBadge from "./plan-badge";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Navbar() {
  const { isLoaded, isSignedIn } = useAuth();
  const [userPlan, setUserPlan] = useState<string>("Free");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Check if user has a paid plan
  const hasPaidPlan = userPlan === "Basic" || userPlan === "Pro";

  const features = [
    { name: "Dashboard", href: "/dashboard", icon: FileText },
    { name: "Legal Chat", href: "/legal-chat", icon: MessageSquare },
    { name: "Compliance Analysis", href: "/upload", icon: ShieldCheck },
    { name: "Generate Document", href: "/generate", icon: Sparkles },
  ];

  return (
    <nav className="container mx-auto py-4 px-4 lg:px-8">
      <div className="flex items-center justify-between">
        {/* Left: Logo + Features Dropdown */}
        <div className="flex items-center gap-6">
          <NavLink
            href="/"
            className="flex items-center gap-2 shrink-0"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Scale className="w-6 h-6 lg:w-8 lg:h-8 text-rose-600 hover:rotate-12 transform transition duration-200 ease-in-out" />
            <span className="font-extrabold text-lg lg:text-xl text-gray-900">
              JurisDraft
            </span>
          </NavLink>

          {/* Features Dropdown (Desktop) */}
          {isLoaded && (
            <SignedIn>
              <div className="hidden lg:block relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={`flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-all duration-200 bg-transparent ${
                    dropdownOpen ? "text-gray-900" : ""
                  }`}
                >
                  Features
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-300 ${
                      dropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <div
                  className={`absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl py-2 z-50 transition-all duration-300 origin-top ${
                    dropdownOpen
                      ? "opacity-100 scale-100 translate-y-0"
                      : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                  }`}
                >
                  {features.map((feature) => {
                    const Icon = feature.icon;
                    return (
                      <Link
                        key={feature.name}
                        href={feature.href}
                        onClick={() => setDropdownOpen(false)}
                        className="group flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition-all duration-200"
                      >
                        <Icon className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                        <span className="group-hover:text-base group-hover:font-semibold transition-all duration-200">
                          {feature.name}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </SignedIn>
          )}
        </div>

        {/* Right: Contact + User Controls (Desktop) */}
        <div className="hidden lg:flex items-center gap-4">
          <NavLink href="/contact">Contact</NavLink>
          {isLoaded ? (
            <>
              <SignedIn>
                {!hasPaidPlan && (
                  <NavLink
                    href="/#pricing"
                    className="text-rose-600 font-semibold"
                  >
                    Pricing
                  </NavLink>
                )}
                <PlanBadge />
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
              <SignedOut>
                {!hasPaidPlan && (
                  <NavLink
                    href="/#pricing"
                    className="text-rose-600 font-semibold"
                  >
                    Pricing
                  </NavLink>
                )}
                <NavLink href="/sign-in">Sign In</NavLink>
              </SignedOut>
            </>
          ) : (
            <div className="h-10 w-20" />
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex lg:hidden items-center gap-3">
          {isLoaded && (
            <SignedIn>
              <PlanBadge />
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-4 pb-4 border-t border-gray-200 pt-4 space-y-3">
          {isLoaded && (
            <>
              <SignedIn>
                <div className="flex flex-col space-y-3">
                  {features.map((feature) => {
                    const Icon = feature.icon;
                    return (
                      <Link
                        key={feature.name}
                        href={feature.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 text-sm font-medium text-gray-700 hover:text-rose-600 transition-colors"
                      >
                        <Icon className="w-4 h-4" />
                        {feature.name}
                      </Link>
                    );
                  })}
                  <div className="border-t border-gray-200 pt-3 mt-3"></div>
                </div>
              </SignedIn>
              <SignedOut>
                {!hasPaidPlan && (
                  <NavLink
                    href="/#pricing"
                    className="block text-rose-600 font-semibold"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Pricing
                  </NavLink>
                )}
              </SignedOut>
            </>
          )}
          <NavLink
            href="/contact"
            className="block"
            onClick={() => setMobileMenuOpen(false)}
          >
            Contact
          </NavLink>
          {isLoaded && (
            <SignedOut>
              <NavLink
                href="/sign-in"
                className="block"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </NavLink>
            </SignedOut>
          )}
        </div>
      )}
    </nav>
  );
}
