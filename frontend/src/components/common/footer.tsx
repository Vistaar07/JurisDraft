import Link from "next/link";
import { Github, FileText, Sparkles, ArrowRight } from "lucide-react";
import { Badge } from "../ui/badge";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-rose-100/30 bg-gradient-to-b from-white to-gray-50">
      {/* Background decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 transform-gpu overflow-hidden blur-3xl"
      >
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-rose-200/30 via-rose-300 to-rose-50/5 opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem] animate-gradient-x"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.8% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 right-0 -z-10 transform-gpu overflow-hidden blur-2xl"
      >
        <div
          className="relative left-[calc(50%+11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-r from-rose-500/10 to-rose-600/30 opacity-10 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] animate-gradient-x"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.8% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>

      <div className="container mx-auto py-16 px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-10">
          {/* Brand Section */}
          <div className="md:col-span-5 flex flex-col">
            <div className="flex items-center gap-2 mb-4 group">
              <div className="p-[1px] overflow-hidden rounded-md bg-linear-to-r from-rose-500/10 to-transparent">
                <div className="bg-white rounded-md p-1">
                  <FileText className="w-7 h-7 text-rose-600 group-hover:scale-110 transition-transform duration-300" />
                </div>
              </div>
              <span className="font-extrabold text-xl text-gray-900 tracking-tight">
                JurisDraft
              </span>
            </div>
            <div className="relative p-[1px] overflow-hidden rounded-lg bg-gradient-to-r from-rose-200/30 via-rose-500/5 to-transparent mb-6">
              <div className="bg-white/80 backdrop-blur-xs rounded-lg p-4 border border-rose-100/30">
                <p className="text-gray-600">
                  Generate professional legal documents instantly with
                  AI-powered precision.
                </p>
              </div>
            </div>{" "}
            <div className="mt-auto">
              <div className="relative p-4 overflow-hidden rounded-lg bg-gradient-to-r from-rose-600/50 to-rose-500/10 border-2 border-rose-300 mb-3 group">
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm transition-opacity group-hover:opacity-0 duration-300"></div>
                <div className="relative flex items-center gap-2">
                  <div className="p-1.5 bg-white rounded-full border border-rose-100 shadow-sm">
                    <Sparkles className="h-5 w-5 text-rose-600 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-gray-900 group-hover:text-white transition-colors duration-300">
                      Created by Ammar, Vistaar, Shawn and Arpita
                    </p>
                    <p className="text-xs text-gray-600 group-hover:text-white/90 transition-colors duration-300">
                      Developer & Designer
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Link
                  href="https://github.com/Vistaar07/JurisDraft"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  className="p-2.5 rounded-full bg-gray-100 hover:bg-rose-100 hover:scale-110 transition-all duration-300 group shadow-sm"
                >
                  <Github className="w-5 h-5 text-gray-700 group-hover:text-rose-600 transition-colors" />
                </Link>
              </div>
            </div>
          </div>
          {/* Spacer column */}
          <div className="hidden md:block md:col-span-1"></div>{" "}
          {/* Quick Links */}
          <div className="md:col-span-3">
            <h3 className="font-semibold text-gray-900 mb-5 text-base">
              Quick Links
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/"
                  className="flex items-center gap-2 text-gray-600 hover:text-rose-600 transition-colors group"
                >
                  <ArrowRight className="w-4 h-4 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/#pricing"
                  className="flex items-center gap-2 text-gray-600 hover:text-rose-600 transition-colors group"
                >
                  <ArrowRight className="w-4 h-4 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  <span>Pricing</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-gray-600 hover:text-rose-600 transition-colors group"
                >
                  <ArrowRight className="w-4 h-4 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  <span>Dashboard</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/generate"
                  className="flex items-center gap-2 text-gray-600 hover:text-rose-600 transition-colors group"
                >
                  <ArrowRight className="w-4 h-4 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  <span>Generate Document</span>
                </Link>
              </li>
            </ul>
          </div>{" "}
          {/* Legal Links */}
          <div className="md:col-span-3">
            <h3 className="font-semibold text-gray-900 mb-5 text-base">
              Legal
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/privacy"
                  className="flex items-center gap-2 text-gray-600 hover:text-rose-600 transition-colors group"
                >
                  <ArrowRight className="w-4 h-4 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  <span>Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="flex items-center gap-2 text-gray-600 hover:text-rose-600 transition-colors group"
                >
                  <ArrowRight className="w-4 h-4 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  <span>Terms of Service</span>
                </Link>
              </li>
            </ul>

            <div className="mt-8">
              <Badge
                variant="outline"
                className="bg-rose-50/40 text-rose-600 border-rose-100 hover:bg-rose-50/60 shadow-sm transform transition-transform duration-300 hover:scale-105"
              >
                <Sparkles className="w-3 h-3 mr-1 animate-pulse" /> New Features
                Coming Soon!
              </Badge>
            </div>
          </div>
        </div>

        <div className="border-t border-rose-100/30 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-gray-500 mb-4 sm:mb-0">
            © {new Date().getFullYear()} JurisDraft. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/#pricing"
              className="text-sm text-gray-500 hover:text-rose-600 transition-colors hover:scale-105 duration-300"
            >
              Upgrade
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-gray-500 hover:text-rose-600 transition-colors hover:scale-105 duration-300"
            >
              My Account
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
