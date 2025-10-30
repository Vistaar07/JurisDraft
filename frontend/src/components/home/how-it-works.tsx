import { UploadCloud, BrainCircuit, FileDown, ArrowRight } from "lucide-react";

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 bg-black">
      <div className="container mx-auto px-4 md:px-6">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center gap-4">
          <span className="text-sm font-semibold text-amber-400 tracking-wider">
            HOW IT WORKS
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white max-w-2xl">
            Generate your legal documents in 3 simple steps
          </h2>
        </div>

        {/* Steps Grid/Flex */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 mt-16">
          {/* Step 1: Upload */}
          <div
            className="flex flex-col items-center text-center p-8 
                          bg-neutral-950 border border-neutral-800 rounded-2xl
                          max-w-xs w-full"
          >
            <div className="rounded-full p-4 bg-amber-400/10 border border-amber-400/30">
              <UploadCloud className="h-10 w-10 text-amber-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mt-6 mb-2">
              1. Document Upload
            </h3>
            <p className="text-neutral-400 text-sm">
              Securely upload and drop your existing documents or case files in
              various formats.
            </p>
          </div>

          {/* Arrow (Desktop only) */}
          <ArrowRight className="hidden md:block h-10 w-10 text-neutral-600" />

          {/* Step 2: AI Generation */}
          <div
            className="flex flex-col items-center text-center p-8 
                          bg-neutral-950 border border-neutral-800 rounded-2xl
                          max-w-xs w-full"
          >
            <div className="rounded-full p-4 bg-amber-400/10 border border-amber-400/30">
              <BrainCircuit className="h-10 w-10 text-amber-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mt-6 mb-2">
              2. AI Content Generation
            </h3>
            <p className="text-neutral-400 text-sm">
              Our custom RAG model analyzes your files and generates a precise
              legal draft instantly.
            </p>
          </div>

          {/* Arrow (Desktop only) */}
          <ArrowRight className="hidden md:block h-10 w-10 text-neutral-600" />

          {/* Step 3: Export */}
          <div
            className="flex flex-col items-center text-center p-8 
                          bg-neutral-950 border border-neutral-800 rounded-2xl
                          max-w-xs w-full"
          >
            <div className="rounded-full p-4 bg-amber-400/10 border border-amber-400/30">
              <FileDown className="h-10 w-10 text-amber-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mt-6 mb-2">
              3. Document Export
            </h3>
            <p className="text-neutral-400 text-sm">
              Review your document and export it as a secure, shareable PDF
              file.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
