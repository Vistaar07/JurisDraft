import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PricingSection = () => {
  const plans = [
    {
      name: "Basic",
      description: "For individuals & occasional users",
      price: "$9",
      period: "/ month",
      features: [
        "5 document generations/month",
        "Standard RAG model",
        "PDF export",
        "Email support",
      ],
      isMostPopular: false,
    },
    {
      name: "Pro",
      description: "For professionals & small teams",
      price: "$29",
      period: "/ month",
      features: [
        "50 document generations/month",
        "Advanced RAG model",
        "PDF & .docx export",
        "Document history",
        "Priority support",
      ],
      isMostPopular: true,
    },
    {
      name: "Enterprise",
      description: "For large organizations & legal firms",
      price: "Custom",
      period: "",
      features: [
        "Unlimited generations",
        "Custom RAG model fine-tuning",
        "Team collaboration features",
        "SSO & advanced security",
        "24/7 dedicated support",
      ],
      isMostPopular: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 bg-black">
      <div className="container mx-auto px-4 md:px-6">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center gap-4 mb-16">
          <span className="text-sm font-semibold text-amber-400 tracking-wider">
            PRICING
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white max-w-2xl">
            Find the plan that's right for you
          </h2>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col p-8 rounded-2xl border
                          ${
                            plan.isMostPopular
                              ? "bg-neutral-900 border-amber-400"
                              : "bg-neutral-950 border-neutral-800"
                          }`}
            >
              {plan.isMostPopular && (
                <Badge
                  className="absolute -top-4 left-1/2 -translate-x-1/2
                             bg-amber-400 text-black hover:bg-amber-400"
                >
                  Most Popular
                </Badge>
              )}

              {/* Plan Header */}
              <h3 className="text-2xl font-semibold text-white">{plan.name}</h3>
              <p className="text-neutral-400 mt-2 mb-6">{plan.description}</p>

              {/* Price */}
              <div className="mb-6">
                <span className="text-5xl font-extrabold text-white">
                  {plan.price}
                </span>
                <span className="text-lg text-neutral-500">{plan.period}</span>
              </div>

              {/* Features */}
              <ul className="space-y-3 flex-grow mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-amber-400" />
                    <span className="text-neutral-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Button */}
              <Button
                size="lg"
                className={
                  plan.isMostPopular
                    ? "w-full bg-amber-400 text-black hover:bg-amber-300 font-bold"
                    : "w-full border-neutral-700 hover:bg-neutral-900 hover:text-white"
                }
                variant={plan.isMostPopular ? "default" : "outline"}
              >
                {plan.name === "Enterprise" ? "Contact Sales" : "Get Started"}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
