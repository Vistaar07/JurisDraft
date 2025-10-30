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
    <section>
      <div>Pricing Section</div>
    </section>
  );
};

export default PricingSection;
