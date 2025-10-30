import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section 
      id="cta" 
      className="py-24 bg-neutral-950 border-t border-neutral-800"
    >
      <div className="container mx-auto px-4 md:px-6">
        {/* Centered content */}
        <div className="flex flex-col items-center text-center gap-6 max-w-2xl mx-auto">
          
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Ready to draft with confidence?
          </h2>
          
          <p className="text-lg text-neutral-300">
            Stop waiting, start drafting. Join JurisDraft today and revolutionize 
            your legal workflow in minutes, not hours.
          </p>
          
          {/* Main CTA Button */}
          <Button 
            size="lg" 
            className="bg-amber-400 text-black hover:bg-amber-300 font-bold 
                       text-lg px-8 py-6 mt-4
                       shadow-lg shadow-amber-400/20
                       hover:shadow-xl hover:shadow-amber-400/30 transition-all"
          >
            Get Started
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
