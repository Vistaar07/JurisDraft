import { Scale, Star, UserCircle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const Navbar = () => {
  return (
    <nav
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl mx-auto
      flex items-center justify-between rounded-full px-8 py-5
      border border-neutral-700/80
      bg-black/50 backdrop-blur-lg"
    >
      {/* Left: Logo and Name */}
      <Link href="/" className="flex items-center gap-2 group">
        <Scale className="h-7 w-7 text-amber-400 group-hover:scale-110 transition-transform" />
        <span className="text-xl font-bold text-white">JurisDraft</span>
      </Link>

      {/* Middle: Links (Hidden on mobile) */}
      <div className="hidden md:flex items-center gap-6">
        <Link
          href="#pricing"
          className="text-neutral-300 hover:text-white transition-colors"
        >
          Pricing
        </Link>
        <Link
          href="/documents"
          className="text-neutral-300 hover:text-white transition-colors"
        >
          Your Documents
        </Link>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        <Badge
          variant="outline"
          className="border-amber-400 text-amber-400 hover:bg-amber-400/10 cursor-pointer transition-colors px-3 py-1"
        >
          <Star className="h-4 w-4 mr-2" />
          Upgrade
        </Badge>
        <UserCircle className="h-8 w-8 text-neutral-300 hover:text-white transition-colors cursor-pointer" />
      </div>
    </nav>
  );
};

export default Navbar;
