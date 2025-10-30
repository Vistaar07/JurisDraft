import { Scale, Linkedin, Mail, Twitter } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Footer = () => {
  return (
    <footer className="bg-black border-t border-neutral-800 pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        {/* Main grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Column 1: Brand, Newsletter, Socials */}
          <div className="md:col-span-2 lg:col-span-1">
            {/* Brand */}
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <Scale className="h-7 w-7 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-2xl font-bold text-white">
                JurisDraft
              </span>
            </Link>
            <p className="text-neutral-400 text-sm max-w-xs">
              AI-powered legal assistance to help you draft complex documents with
              multi-model analysis.
            </p>

            {/* Newsletter */}
            <div className="mt-6">
              <h4 className="font-semibold text-white mb-3">
                Subscribe to our newsletter
              </h4>
              <form className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Your email"
                  className="bg-neutral-900 border-neutral-700 focus:border-amber-400"
                />
                <Button
                  type="submit"
                  className="bg-amber-400 text-black hover:bg-amber-300 font-bold"
                  size="icon"
                >
                  &rarr;
                </Button>
              </form>
              <p className="text-neutral-500 text-xs mt-2">
                Get the latest legal AI updates and news.
              </p>
            </div>

            {/* Socials */}
            <div className="mt-6">
              <h4 className="font-semibold text-white mb-3">Follow Us</h4>
              <div className="flex gap-4">
                <Link href="#" className="text-neutral-400 hover:text-white transition-colors">
                  <Linkedin className="h-6 w-6" />
                </Link>
                <Link href="#" className="text-neutral-400 hover:text-white transition-colors">
                  <Twitter className="h-6 w-6" />
                </Link>
                <Link href="#" className="text-neutral-400 hover:text-white transition-colors">
                  <Mail className="h-6 w-6" />
                </Link>
              </div>
            </div>
          </div>

          {/* Column 2: Legal Resources */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">
              Legal Resources
            </h4>
            <ul className="space-y-3">
              <li><Link href="#" className="text-neutral-400 hover:text-white transition-colors">Case Law Database</Link></li>
              <li><Link href="#" className="text-neutral-400 hover:text-white transition-colors">Document Templates</Link></li>
              <li><Link href="#" className="text-neutral-400 hover:text-white transition-colors">Legal Dictionary</Link></li>
              <li><Link href="#" className="text-neutral-400 hover:text-white transition-colors">Legal Forms</Link></li>
              <li><Link href="#" className="text-neutral-400 hover:text-white transition-colors">AI Legal Research</Link></li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">
              Company
            </h4>
            <ul className="space-y-3">
              <li><Link href="#" className="text-neutral-400 hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="#" className="text-neutral-400 hover:text-white transition-colors">Our Team</Link></li>
              <li><Link href="#" className="text-neutral-400 hover:text-white transition-colors">Careers</Link></li>
              <li><Link href="#" className="text-neutral-400 hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="#" className="text-neutral-400 hover:text-white transition-colors">Support</Link></li>
            </ul>
          </div>

          {/* Column 4: Legal Info */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">
              Legal Info
            </h4>
            <ul className="space-y-3">
              <li><Link href="#" className="text-neutral-400 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="text-neutral-400 hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="text-neutral-400 hover:text-white transition-colors">Cookie Policy</Link></li>
              <li><Link href="#" className="text-neutral-400 hover:text-white transition-colors">Disclaimer</Link></li>
              <li><Link href="#" className="text-neutral-400 hover:text-white transition-colors">Accessibility</Link></li>
            </ul>
          </div>
        </div>

        {/* Copyright Bar */}
        <div className="mt-12 pt-8 border-t border-neutral-800 text-center text-neutral-500 text-sm">
          © {new Date().getFullYear()} JurisDraft. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
