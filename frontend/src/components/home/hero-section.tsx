import { BackgroundCircles } from "@/components/ui/shadcn-io/background-circles";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText } from "lucide-react";
import Image from "next/image";

const HeroSection = () => {
  return (
    <section
      id="hero"
      className="relative w-full min-h-screen flex items-start pt-32 bg-black overflow-hidden"
    >
      {/* Top/Bottom Fade Mask */}
      <div
        className="absolute inset-0 z-20"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
        }}
      />

      {/* Main content container */}
      <div className="container relative z-30 grid md:grid-cols-2 items-center gap-8 px-4 md:px-6 py-32">
        {/* Left: Text + Circles */}
        <div className="relative flex justify-start items-center h-full">
          <BackgroundCircles
            variant="septenary"
            className="relative -left-1/4 md:left-0 opacity-40 w-[500px] h-[500px] md:w-[600px] md:h-[600px] flex items-center justify-center"
          >
            {/* Layer 2: Content (Now passed as children) */}
            <div className="relative z-10 flex flex-col items-start text-left gap-4 p-8 -mt-20 ml-8 md:ml-16">
              <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tighter">
                Draft Legal Documents{" "}
                <span className="text-amber-400">Instantly.</span>
              </h1>
              <p className="text-lg text-neutral-300 max-w-lg">
                Stop wrestling with templates. JurisDraft uses advanced AI to
                analyze your needs and generate precise, professional legal
                documents in minutes.
              </p>

              {/* Buttons are now here, after the text */}
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-4">
                <Button
                  size="lg"
                  className="bg-amber-400 text-black hover:bg-amber-300 font-bold"
                >
                  Get Started
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-neutral-700 hover:bg-neutral-900 hover:text-white"
                >
                  Learn More
                  <FileText className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </div>
          </BackgroundCircles>
        </div>

        {/* Right: Image */}
        <div className="hidden md:flex relative justify-end items-center h-[600px]">
          <Image
            src={`/scalefinal.jpg`}
            alt="Statue of Lady Justice"
            fill
            className="object-cover object-right"
            priority
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
